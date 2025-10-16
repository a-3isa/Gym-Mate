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
import { SessionJoinDto, SessionLeaveDto, SetCompleteDto, TurnChangeDto } from './dto';
import { SOCKET_EVENTS } from '../common/constants';
import { AuthService } from '../firebase/services/auth.service';

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

  constructor(private readonly authService: AuthService) {}

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
  async handleSetComplete(
    @MessageBody() data: SetCompleteDto,
    @ConnectedSocket() client: SessionSocket,
  ): Promise<void> {
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

      await Promise.resolve();

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

  @SubscribeMessage(SOCKET_EVENTS.TURN_CHANGE)
  async handleTurnChange(
    @MessageBody() data: TurnChangeDto,
    @ConnectedSocket() client: SessionSocket,
  ): Promise<void> {
    try {
      if (!data.sessionId || !data.nextUserId) {
        throw new WsException('Missing required fields: sessionId and nextUserId');
      }

      // Construct room name
      const roomName = `session:${data.sessionId}`;

      // Check client membership
      const sessions = this.clientSessionMap.get(client.id);
      const sess = sessions?.get(data.sessionId);
      if (!sess) {
        throw new WsException('Client is not a member of the requested session');
      }

      // Broadcast turn change to all clients in the room, including sessionId
      this.server.to(roomName).emit(SOCKET_EVENTS.TURN_CHANGE, {
        sessionId: data.sessionId,
        nextUserId: data.nextUserId,
        timestamp: new Date().toISOString(),
      });

      await Promise.resolve();

      this.logger.log(`Turn changed in session ${data.sessionId} to user ${data.nextUserId}`);
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Error handling turn change: ${message}`);
      client.emit(SOCKET_EVENTS.ERROR, {
        message: message || 'Failed to change turn',
        code: 'TURN_CHANGE_ERROR',
      });
    }
  }
}
