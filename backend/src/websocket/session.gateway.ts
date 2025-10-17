import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import type { DefaultEventsMap, Socket } from 'socket.io';
import {
  SessionJoinDto,
  SessionLeaveDto,
  SetCompleteDto,
  TurnChangeDto,
  TimerStartDto,
  TimerSyncDto,
  TimerStopDto,
  TimerType,
  SessionUpdateDto,
  SessionStartDto,
  SessionEndDto,
  ExerciseChangeDto,
} from './dto';
import { SOCKET_EVENTS } from '../common/constants';
import { AuthService } from '../firebase/services/auth.service';
import { FirestoreService } from '../firebase/services/firestore.service';
import { COLLECTIONS } from '../common/constants/firestore.constants';
import { Session } from '../common/interfaces/session.interface';
import { serializeSession } from '../common/utils/serializeSession';

interface SessionUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}

interface SessionSocketData {
  user?: SessionUser;
}

type SessionSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SessionSocketData
> & {
  data: SessionSocketData;
};

/**
 * SessionGateway
 *
 * WebSocket gateway for real-time workout session synchronization.
 * Uses room-based architecture to enable real-time communication
 * between workout partners during collaborative sessions.
 *
 * Note: CORS configuration is handled globally by ConfiguredSocketIoAdapter
 * which reads websocket.corsOrigin from ConfigService.
 */
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
@WebSocketGateway({
  namespace: '/sessions',
})
export class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SessionGateway.name);

  private readonly clientSessionMap = new Map<string, Map<string, { userId: string }>>();
  private readonly timerOwners = new Map<string, string>(); // key: `${sessionId}:${timerType}`, value: userId
  private readonly timerStartTimestamps = new Map<string, number>(); // key: `${sessionId}:${timerType}`, value: epoch ms

  constructor(
    private readonly authService: AuthService,
    private readonly firestoreService: FirestoreService,
  ) {}

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return typeof error === 'string' ? error : 'Unknown error';
  }

  /**
   * Handle client connection with authentication
   * Verifies Firebase ID token from query params or headers
   * @param client Connected socket client
   */
  async handleConnection(client: SessionSocket): Promise<void> {
    this.logger.log(`Client connected: ${client.id}`);

    try {
      // Extract token from query parameters or headers
      const queryParams = client.handshake.query as Partial<Record<string, string | string[]>>;
      const queryTokenRaw = queryParams.token;
      const queryToken =
        typeof queryTokenRaw === 'string'
          ? queryTokenRaw
          : Array.isArray(queryTokenRaw)
            ? queryTokenRaw[0]
            : undefined;
      const headers = client.handshake.headers as Record<string, string | string[] | undefined>;
      const authorizationHeader = headers.authorization;
      const headerValue = Array.isArray(authorizationHeader)
        ? authorizationHeader[0]
        : authorizationHeader;
      const headerToken =
        typeof headerValue === 'string' && headerValue.startsWith('Bearer ')
          ? headerValue.slice(7).trim()
          : undefined;
      const token = queryToken ?? headerToken;

      if (!token) {
        this.logger.warn(`No authentication token provided for client ${client.id}`);
        client.emit(SOCKET_EVENTS.ERROR, {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        client.disconnect();
        return;
      }

      // Verify the Firebase ID token
      const decodedToken = await this.authService.verifyIdToken(token);

      // Extract user info
      const { uid, email, name } = decodedToken;

      // Create user object with explicit typing
      const user: SessionUser = {
        uid,
        email: email ?? null,
        displayName: (name ?? null) as string | null,
      };

      // Store user info in socket data for later use
      client.data = {
        user,
      };

      this.logger.log(`Authenticated WebSocket client ${client.id} for user ${uid}`);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to authenticate WebSocket client ${client.id}: ${this.getErrorMessage(error)}`,
      );
      client.emit(SOCKET_EVENTS.ERROR, {
        message: 'Authentication failed',
        code: 'AUTH_FAILED',
      });
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   * @param client Disconnected socket client
   */
  handleDisconnect(client: SessionSocket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    const sessions = this.clientSessionMap.get(client.id);
    if (sessions) {
      for (const [sessionId, { userId }] of sessions.entries()) {
        const roomName = `session:${sessionId}`;
        this.server.to(roomName).emit(SOCKET_EVENTS.SESSION_LEAVE, {
          sessionId,
          userId,
          timestamp: new Date().toISOString(),
        });

        // Clear timer ownership for all timers tied to this session
        const timersToClear: { key: string; timerType: string }[] = [];
        for (const timerEntry of this.timerOwners.keys()) {
          if (timerEntry.startsWith(`${sessionId}:`)) {
            const timerType = timerEntry.split(':')[1];
            timersToClear.push({ key: timerEntry, timerType });
          }
        }

        for (const { key: timerKey, timerType } of timersToClear) {
          this.timerOwners.delete(timerKey);
          this.timerStartTimestamps.delete(timerKey);
          this.server.to(roomName).emit(SOCKET_EVENTS.TIMER_STOP, {
            sessionId,
            timerType,
            timestamp: new Date().toISOString(),
          });
          this.logger.debug(
            `Timer ownership cleared on disconnect for ${timerKey} - emitted TIMER_STOP`,
          );
        }
      }
    }
    this.clientSessionMap.delete(client.id);
    // Socket.IO automatically removes client from all rooms on disconnect
  }

  /**
   * Handle session join request
   * @param data SessionJoinDto containing sessionId and userId
   * @param client Socket client
   */
  @SubscribeMessage(SOCKET_EVENTS.SESSION_JOIN)
  async handleJoinSession(
    @MessageBody() data: SessionJoinDto,
    @ConnectedSocket() client: SessionSocket,
  ): Promise<void> {
    try {
      // Check if client is authenticated
      const userData = client.data.user;
      if (!userData) {
        throw new WsException('Not authenticated');
      }

      // Use authenticated user ID instead of client-provided userId
      const authenticatedUserId = userData.uid;

      // Authorization: verify user is a participant of the session
      const sessionRef = this.firestoreService.getDocument(COLLECTIONS.SESSIONS, data.sessionId);
      const snap = await sessionRef.get();

      if (!snap.exists) {
        client.emit(SOCKET_EVENTS.ERROR, {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        });
        return;
      }

      const sessionData = snap.data() as { participantUids?: string[] } | undefined;
      const allowed = Array.isArray(sessionData?.participantUids)
        ? sessionData.participantUids.includes(authenticatedUserId)
        : false;

      if (!allowed) {
        client.emit(SOCKET_EVENTS.ERROR, {
          message: 'Not authorized to join this session',
          code: 'SESSION_JOIN_UNAUTHORIZED',
        });
        return;
      }

      // Construct room name
      const roomName = `session:${data.sessionId}`;

      // Join the room
      await client.join(roomName);

      // on join
      let sessions = this.clientSessionMap.get(client.id);
      if (!sessions) {
        sessions = new Map();
        this.clientSessionMap.set(client.id, sessions);
      }
      sessions.set(data.sessionId, { userId: authenticatedUserId });

      // Emit join event to all clients in the room
      this.server.to(roomName).emit(SOCKET_EVENTS.SESSION_JOIN, {
        userId: authenticatedUserId,
        sessionId: data.sessionId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`User ${authenticatedUserId} joined session ${data.sessionId}`);
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Error joining session: ${message}`);
      client.emit(SOCKET_EVENTS.ERROR, {
        message: message || 'Failed to join session',
        code: 'SESSION_JOIN_ERROR',
      });
    }
  }

  /**
   * Handle session leave request
   * @param data Object containing sessionId
   * @param client Socket client
   */
  @SubscribeMessage(SOCKET_EVENTS.SESSION_LEAVE)
  async handleLeaveSession(
    @MessageBody() data: SessionLeaveDto,
    @ConnectedSocket() client: SessionSocket,
  ): Promise<void> {
    try {
      // Construct room name
      const roomName = `session:${data.sessionId}`;

      // Leave the room
      await client.leave(roomName);

      // on leave
      const sessions = this.clientSessionMap.get(client.id);
      const sess = sessions?.get(data.sessionId);
      if (!sess) {
        throw new WsException('Client is not a member of the requested session');
      }

      // Verify the authenticated user matches the session user
      const userData = client.data.user;
      if (userData && userData.uid !== sess.userId) {
        throw new WsException('Unauthorized to leave session for another user');
      }

      const userId = sess.userId;

      // Clear timer ownership for all timers tied to this session
      const timersToClear = Array.from(this.timerOwners.keys()).filter((timerKey) =>
        timerKey.startsWith(`${data.sessionId}:`),
      );
      timersToClear.forEach((timerKey) => this.timerOwners.delete(timerKey));

      sessions?.delete(data.sessionId);
      if (sessions?.size === 0) {
        this.clientSessionMap.delete(client.id);
      }

      // Emit leave event to remaining clients in the room
      this.server.to(roomName).emit(SOCKET_EVENTS.SESSION_LEAVE, {
        sessionId: data.sessionId,
        userId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Client ${userId} left session ${data.sessionId}`);
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Error leaving session: ${message}`);
      client.emit(SOCKET_EVENTS.ERROR, {
        message: message || 'Failed to leave session',
        code: 'SESSION_LEAVE_ERROR',
      });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.SET_COMPLETE)
  handleSetComplete(
    @MessageBody() data: SetCompleteDto,
    @ConnectedSocket() client: SessionSocket,
  ): void {
    try {
      // Construct room name
      const roomName = `session:${data.sessionId}`;

      // on set
      const sessions = this.clientSessionMap.get(client.id);
      const sess = sessions?.get(data.sessionId);
      if (!sess) {
        throw new WsException('Client is not a member of the requested session');
      }

      // Verify the authenticated user matches the session user
      const userData = client.data.user;
      if (userData && userData.uid !== sess.userId) {
        throw new WsException('Unauthorized to complete set for another user');
      }

      const userId = sess.userId;

      // Broadcast set completion to all clients in the room
      this.server.to(roomName).emit(SOCKET_EVENTS.SET_COMPLETE, {
        sessionId: data.sessionId,
        exerciseId: data.exerciseId,
        setNumber: data.setNumber,
        weight: data.weight,
        reps: data.reps,
        userId,
        timestamp: new Date().toISOString(),
      });

      // Also emit weight update for external consumers
      this.server.to(roomName).emit(SOCKET_EVENTS.WEIGHT_UPDATE, {
        sessionId: data.sessionId,
        exerciseId: data.exerciseId,
        setNumber: data.setNumber,
        weight: data.weight,
        reps: data.reps,
        userId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Set completed in session ${data.sessionId} by user ${userId}: Exercise ${data.exerciseId}, Set ${data.setNumber}, ${data.weight}kg x ${data.reps} reps`,
      );
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Error handling set completion: ${message}`);
      client.emit(SOCKET_EVENTS.ERROR, {
        message: message || 'Failed to record set completion',
        code: 'SET_COMPLETE_ERROR',
      });
    }
  }

  /**
   * Handle turn change events from clients.
   * Note: TURN_CHANGE is server-only and should be emitted via SESSION_UPDATE after switchTurn().
   * This handler rejects client-originated turn changes for security.
   */
  @SubscribeMessage(SOCKET_EVENTS.TURN_CHANGE)
  handleTurnChange(
    @MessageBody() data: TurnChangeDto,
    @ConnectedSocket() client: SessionSocket,
  ): void {
    this.logger.warn(
      `Client ${client.id} attempted to send TURN_CHANGE - rejecting as server-only event`,
    );
    client.emit(SOCKET_EVENTS.ERROR, {
      message: 'TURN_CHANGE is a server-only event. Use SESSION_UPDATE after switchTurn()',
      code: 'TURN_CHANGE_SERVER_ONLY',
    });
  }

  /**
   * Handle timer:start events from a client.
   * Validates membership, then broadcasts to the session room.
   * Note: startedBy is derived from the authenticated socket and not required from clients.
   */
  @SubscribeMessage(SOCKET_EVENTS.TIMER_START)
  handleTimerStart(
    @MessageBody() data: TimerStartDto,
    @ConnectedSocket() client: SessionSocket,
  ): void {
    try {
      const sessions = this.clientSessionMap.get(client.id);
      const sess = sessions?.get(data.sessionId);
      if (!sess) {
        throw new WsException('Client is not a member of the requested session');
      }

      const userId = sess.userId;
      const roomName = `session:${data.sessionId}`;

      // Validate timer duration
      if (data.duration > 600) {
        client.emit(SOCKET_EVENTS.ERROR, {
          message: 'Timer duration exceeds maximum allowed (600 seconds)',
          code: 'TIMER_DURATION_INVALID',
        });
        return;
      }

      // Check if timer is already active
      const timerKey = `${data.sessionId}:${data.timerType}`;
      const existingOwner = this.timerOwners.get(timerKey);

      if (existingOwner && existingOwner !== userId) {
        client.emit(SOCKET_EVENTS.ERROR, {
          message: 'Timer is already active',
          code: 'TIMER_ALREADY_ACTIVE',
        });
        return;
      }

      if (existingOwner && existingOwner === userId) {
        const lastStartedAt = this.timerStartTimestamps.get(timerKey);
        const now = Date.now();
        if (lastStartedAt && now - lastStartedAt < 2000) {
          this.logger.debug(
            `Duplicate TIMER_START ignored for ${timerKey} from owner ${userId} within debounce window`,
          );
          return;
        }
      }

      // Track timer ownership
      this.timerOwners.set(timerKey, userId);
      this.timerStartTimestamps.set(timerKey, Date.now());

      this.server.to(roomName).emit(SOCKET_EVENTS.TIMER_START, {
        sessionId: data.sessionId,
        timerType: data.timerType,
        duration: data.duration,
        startedBy: userId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `Timer started in session ${data.sessionId} by ${userId} (${data.timerType}, ${data.duration}s)`,
      );
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Error handling timer start: ${message}`);
      client.emit(SOCKET_EVENTS.ERROR, {
        message: message || 'Failed to start timer',
        code: 'TIMER_START_ERROR',
      });
    }
  }

  /**
   * Handle timer:sync events from a client.
   * Broadcasts remaining seconds to the session room.
   */
  @SubscribeMessage(SOCKET_EVENTS.TIMER_SYNC)
  handleTimerSync(
    @MessageBody() data: TimerSyncDto,
    @ConnectedSocket() client: SessionSocket,
  ): void {
    try {
      const sessions = this.clientSessionMap.get(client.id);
      const sess = sessions?.get(data.sessionId);
      if (!sess) {
        throw new WsException('Client is not a member of the requested session');
      }

      const roomName = `session:${data.sessionId}`;

      // Enforce timer ownership: only the timer starter can sync
      const timerKey = `${data.sessionId}:${data.timerType}`;
      const ownerUserId = this.timerOwners.get(timerKey);
      const currentUserId = client.data.user?.uid;

      if (!ownerUserId || currentUserId !== ownerUserId) {
        this.logger.debug(
          `Timer sync rejected: user ${currentUserId} is not the owner of ${timerKey} (owner: ${ownerUserId})`,
        );
        return;
      }

      this.server.to(roomName).emit(SOCKET_EVENTS.TIMER_SYNC, {
        sessionId: data.sessionId,
        timerType: data.timerType,
        remainingSeconds: data.remainingSeconds,
        timestamp: new Date().toISOString(),
      });

      // Emit TIMER_STOP on timer completion (remainingSeconds === 0)
      if (data.remainingSeconds === 0) {
        const completionTimerKey = `${data.sessionId}:${data.timerType}`;
        this.timerOwners.delete(completionTimerKey);
        this.timerStartTimestamps.delete(completionTimerKey);

        this.server.to(roomName).emit(SOCKET_EVENTS.TIMER_STOP, {
          sessionId: data.sessionId,
          timerType: data.timerType,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(
          `Timer completed in session ${data.sessionId} (${data.timerType}) - emitted TIMER_STOP`,
        );
      }

      this.logger.debug(
        `Timer sync for session ${data.sessionId} (${data.timerType} -> ${data.remainingSeconds}s)`,
      );
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Error handling timer sync: ${message}`);
      client.emit(SOCKET_EVENTS.ERROR, {
        message: message || 'Failed to sync timer',
        code: 'TIMER_SYNC_ERROR',
      });
    }
  }

  /**
   * Handle timer:stop events from a client.
   * Broadcasts stop to the session room.
   */
  @SubscribeMessage(SOCKET_EVENTS.TIMER_STOP)
  handleTimerStop(
    @MessageBody() data: TimerStopDto,
    @ConnectedSocket() client: SessionSocket,
  ): void {
    try {
      const sessions = this.clientSessionMap.get(client.id);
      const sess = sessions?.get(data.sessionId);
      if (!sess) {
        throw new WsException('Client is not a member of the requested session');
      }
      const roomName = `session:${data.sessionId}`;

      // Check timer ownership before allowing stop
      const timerKey = `${data.sessionId}:${data.timerType}`;
      const ownerUserId = this.timerOwners.get(timerKey);
      const currentUserId = client.data.user?.uid;

      // Allow non-owners to stop rest timers only (UX consideration)
      if (ownerUserId && currentUserId !== ownerUserId && data.timerType !== TimerType.rest) {
        this.logger.debug(
          `Timer stop rejected: user ${currentUserId} is not the owner of ${timerKey} (owner: ${ownerUserId})`,
        );
        return;
      }

      // Clear timer ownership on stop
      this.timerOwners.delete(timerKey);
      this.timerStartTimestamps.delete(timerKey);

      this.server.to(roomName).emit(SOCKET_EVENTS.TIMER_STOP, {
        sessionId: data.sessionId,
        timerType: data.timerType,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Error handling timer stop: ${message}`);
      client.emit(SOCKET_EVENTS.ERROR, {
        message: message || 'Failed to stop timer',
        code: 'TIMER_STOP_ERROR',
      });
    }
  }

  /**
   * Emits a session:update with full serialized session to the room.
   */
  public emitSessionUpdate(sessionId: string, session: Session): void {
    try {
      const roomName = `session:${sessionId}`;
      const payload: SessionUpdateDto = {
        sessionId,
        session: serializeSession(session),
      };
      this.server.to(roomName).emit(SOCKET_EVENTS.SESSION_UPDATE, payload);
      this.logger.debug(`Emitted SESSION_UPDATE for session ${sessionId}`);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to emit SESSION_UPDATE for ${sessionId}: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /** Emits session:start to the room. */
  public emitSessionStart(sessionId: string, startedBy: string): void {
    try {
      const roomName = `session:${sessionId}`;
      const payload: SessionStartDto = { sessionId, startedBy };
      this.server.to(roomName).emit(SOCKET_EVENTS.SESSION_START, payload);
      this.logger.log(`Emitted SESSION_START for session ${sessionId} by ${startedBy}`);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to emit SESSION_START for ${sessionId}: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /** Emits exercise:change to the room. */
  public emitExerciseChange(
    sessionId: string,
    exerciseIndex: number,
    exerciseId: string,
    exerciseName: string,
  ): void {
    try {
      const roomName = `session:${sessionId}`;
      const payload: ExerciseChangeDto = { sessionId, exerciseIndex, exerciseId, exerciseName };
      this.server.to(roomName).emit(SOCKET_EVENTS.EXERCISE_CHANGE, payload);
      this.logger.log(
        `Emitted EXERCISE_CHANGE for session ${sessionId} -> index ${exerciseIndex} (${exerciseName})`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to emit EXERCISE_CHANGE for ${sessionId}: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /** Emits session:end to the room. */
  public emitSessionEnd(sessionId: string, completedAt: string): void {
    try {
      const roomName = `session:${sessionId}`;
      const payload: SessionEndDto = { sessionId, completedAt };
      this.server.to(roomName).emit(SOCKET_EVENTS.SESSION_END, payload);
      this.logger.log(`Emitted SESSION_END for session ${sessionId}`);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to emit SESSION_END for ${sessionId}: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /** Emits avatar:evolution to the room for immediate client feedback. */
  public emitAvatarEvolution(
    sessionId: string,
    userId: string,
    evolution: { previousLevel: number; newLevel: number; muscleGroupsGained: string[] },
  ): void {
    try {
      const roomName = `session:${sessionId}`;
      const payload = {
        sessionId,
        userId,
        previousLevel: evolution.previousLevel,
        newLevel: evolution.newLevel,
        muscleGroupsGained: evolution.muscleGroupsGained,
        timestamp: new Date().toISOString(),
      };
      this.server.to(roomName).emit('avatar:evolution', payload);
      this.logger.log(
        `Emitted AVATAR_EVOLUTION for user ${userId} in session ${sessionId}: Level ${evolution.previousLevel} → ${evolution.newLevel}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to emit AVATAR_EVOLUTION for ${sessionId}: ${this.getErrorMessage(error)}`,
      );
    }
  }
}
