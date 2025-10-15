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
import { Server, Socket } from 'socket.io';
import { SessionJoinDto, SessionLeaveDto, SetCompleteDto } from './dto';
import { SOCKET_EVENTS } from '../common/constants';

/**
 * SessionGateway
 *
 * WebSocket gateway for real-time workout session synchronization.
 * Uses room-based architecture to enable real-time communication
 * between workout partners during collaborative sessions.
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
  server: Server;

  private readonly logger = new Logger(SessionGateway.name);

  private readonly clientSessionMap = new Map<
    string,
    {
      sessionId: string;
      userId: string;
    }
  >();

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return typeof error === 'string' ? error : 'Unknown error';
  }

  /**
   * Handle client connection
   * @param client Connected socket client
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Handle client disconnection
   * @param client Disconnected socket client
   */
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
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
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      // Construct room name
      const roomName = `session:${data.sessionId}`;

      // Join the room
      await client.join(roomName);

      this.clientSessionMap.set(client.id, {
        sessionId: data.sessionId,
        userId: data.userId,
      });

      // Emit join event to all clients in the room
      this.server.to(roomName).emit(SOCKET_EVENTS.SESSION_JOIN, {
        userId: data.userId,
        sessionId: data.sessionId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`User ${data.userId} joined session ${data.sessionId}`);
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
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      // Construct room name
      const roomName = `session:${data.sessionId}`;

      // Leave the room
      await client.leave(roomName);

      const clientSession = this.clientSessionMap.get(client.id);
      if (!clientSession || clientSession.sessionId !== data.sessionId) {
        throw new WsException('Client is not a member of the requested session');
      }

      if (data.userId && data.userId !== clientSession.userId) {
        throw new WsException('Mismatched user identity in session leave request');
      }

      const userId = clientSession.userId;

      this.clientSessionMap.delete(client.id);

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

  /**
   * Handle set completion
   * @param data SetCompleteDto containing set details
   * @param client Socket client
   */
  @SubscribeMessage(SOCKET_EVENTS.SET_COMPLETE)
  async handleSetComplete(
    @MessageBody() data: SetCompleteDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      // Construct room name
      const roomName = `session:${data.sessionId}`;

      const clientSession = this.clientSessionMap.get(client.id);
      if (!clientSession || clientSession.sessionId !== data.sessionId) {
        throw new WsException('Client is not a member of the requested session');
      }

      if (data.userId && data.userId !== clientSession.userId) {
        throw new WsException('Mismatched user identity in set completion request');
      }

      const userId = clientSession.userId;

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
   * Handle turn change in collaborative workout
   * @param data Object containing sessionId and nextUserId
   * @param client Socket client
   */
  @SubscribeMessage(SOCKET_EVENTS.TURN_CHANGE)
  async handleTurnChange(
    @MessageBody() data: { sessionId: string; nextUserId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      if (!data.sessionId || !data.nextUserId) {
        throw new WsException('Missing required fields: sessionId and nextUserId');
      }

      // Construct room name
      const roomName = `session:${data.sessionId}`;

      // Broadcast turn change to all clients in the room
      this.server.to(roomName).emit(SOCKET_EVENTS.TURN_CHANGE, {
        nextUserId: data.nextUserId,
        timestamp: new Date().toISOString(),
      });

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
