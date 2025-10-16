import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpStatus,
  HttpCode,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionDto, AcceptSessionDto, RecordSetDto } from './dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */

/**
 * Serializes Firestore Timestamps to ISO strings for API responses
 * @param session - Session object with potential Timestamp fields
 * @returns Session with timestamps as ISO strings
 */
const serializeSession = (session: any): any => {
  const serialized = { ...session };
  if (serialized.createdAt && typeof serialized.createdAt.toDate === 'function') {
    serialized.createdAt = serialized.createdAt.toDate().toISOString();
  }
  if (serialized.startedAt && typeof serialized.startedAt.toDate === 'function') {
    serialized.startedAt = serialized.startedAt.toDate().toISOString();
  }
  if (serialized.completedAt && typeof serialized.completedAt.toDate === 'function') {
    serialized.completedAt = serialized.completedAt.toDate().toISOString();
  }
  // Serialize timestamps in sets
  if (serialized.sets) {
    serialized.sets = serialized.sets.map((set: any) => {
      if (set.completedAt && typeof set.completedAt.toDate === 'function') {
        return { ...set, completedAt: set.completedAt.toDate().toISOString() };
      }
      return set;
    });
  }
  return serialized;
};

/**
 * Controller for managing workout sessions
 * Handles session creation, invites, turn-based progression, and set recording
 */
@Controller('sessions')
export class SessionsController {
  private readonly logger = new Logger(SessionsController.name);

  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * Creates a new workout session with a friend
   * @param createSessionDto - Session creation data with friend and exercises
   * @param user - Authenticated user creating the session
   * @returns Created session with 201 status
   */
  @Post()
  @UseGuards(FirebaseAuthGuard)
  @UsePipes(ValidationPipe)
  @HttpCode(HttpStatus.CREATED)
  async createSession(@Body() createSessionDto: CreateSessionDto, @CurrentUser() user: any) {
    try {
      const session = await this.sessionsService.createSession(
        user.uid,
        createSessionDto.friendUid,
        createSessionDto.exercises,
      );
      return serializeSession(session);
    } catch (error) {
      this.logger.error(`Error creating session: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create session');
    }
  }

  /**
   * Retrieves all sessions for the authenticated user
   * @param status - Optional status filter
   * @param user - Authenticated user
   * @returns Array of user's sessions
   */
  @Get()
  @UseGuards(FirebaseAuthGuard)
  async getUserSessions(@Query('status') status?: string, @CurrentUser() user?: any) {
    try {
      const sessions = await this.sessionsService.getUserSessions(user.uid, status);
      return sessions.map(serializeSession);
    } catch (error) {
      this.logger.error(`Error fetching user sessions: ${error.message}`);
      throw new BadRequestException('Failed to fetch sessions');
    }
  }

  /**
   * Retrieves a specific session by ID
   * @param sessionId - Session ID
   * @param user - Authenticated user
   * @returns Session object or 404 if not found
   */
  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  async getSessionById(@Param('id') sessionId: string, @CurrentUser() user: any) {
    try {
      const session = await this.sessionsService.getSessionById(sessionId, user.uid);
      return serializeSession(session);
    } catch (error) {
      this.logger.error(`Error fetching session ${sessionId}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch session');
    }
  }

  /**
   * Accepts or declines a session invitation
   * @param sessionId - Session ID
   * @param acceptSessionDto - Acceptance data with optional exercise modifications
   * @param user - Authenticated user
   * @returns Updated session
   */
  @Post(':id/accept')
  @UseGuards(FirebaseAuthGuard)
  @UsePipes(ValidationPipe)
  async acceptSession(
    @Param('id') sessionId: string,
    @Body() acceptSessionDto: AcceptSessionDto,
    @CurrentUser() user: any,
  ) {
    try {
      const session = await this.sessionsService.acceptSession(
        sessionId,
        user.uid,
        acceptSessionDto.accepted,
        acceptSessionDto.exercises,
      );
      return serializeSession(session);
    } catch (error) {
      this.logger.error(`Error accepting session ${sessionId}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to accept session');
    }
  }

  /**
   * Updates session status
   * @param sessionId - Session ID
   * @param updateSessionDto - Update data with new status
   * @param user - Authenticated user
   * @returns Updated session
   */
  @Patch(':id/status')
  @UseGuards(FirebaseAuthGuard)
  @UsePipes(ValidationPipe)
  async updateSessionStatus(
    @Param('id') sessionId: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @CurrentUser() user: any,
  ) {
    try {
      if (!updateSessionDto.status) {
        throw new BadRequestException('Status is required');
      }
      const session = await this.sessionsService.updateSessionStatus(
        sessionId,
        user.uid,
        updateSessionDto.status,
      );
      return serializeSession(session);
    } catch (error) {
      this.logger.error(`Error updating session ${sessionId} status: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to update session status');
    }
  }

  /**
   * Records a completed set
   * @param sessionId - Session ID
   * @param recordSetDto - Set data with exercise, weight, and reps
   * @param user - Authenticated user
   * @returns Updated session with new set recorded
   */
  @Post(':id/sets')
  @UseGuards(FirebaseAuthGuard)
  @UsePipes(ValidationPipe)
  async recordSet(
    @Param('id') sessionId: string,
    @Body() recordSetDto: RecordSetDto,
    @CurrentUser() user: any,
  ) {
    try {
      const session = await this.sessionsService.recordSet(
        sessionId,
        user.uid,
        recordSetDto.exerciseId,
        recordSetDto.setNumber,
        recordSetDto.weight,
        recordSetDto.reps,
      );
      return serializeSession(session);
    } catch (error) {
      this.logger.error(`Error recording set for session ${sessionId}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to record set');
    }
  }

  /**
   * Manually switches turn to the other participant
   * @param sessionId - Session ID
   * @param user - Authenticated user
   * @returns Updated session with toggled turn
   */
  @Post(':id/turn')
  @UseGuards(FirebaseAuthGuard)
  async switchTurn(@Param('id') sessionId: string, @CurrentUser() user: any) {
    try {
      const session = await this.sessionsService.switchTurn(sessionId, user.uid);
      return serializeSession(session);
    } catch (error) {
      this.logger.error(`Error switching turn for session ${sessionId}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to switch turn');
    }
  }

  /**
   * Completes a session early
   * @param sessionId - Session ID
   * @param user - Authenticated user
   * @returns Completed session
   */
  @Post(':id/complete')
  @UseGuards(FirebaseAuthGuard)
  async completeSession(@Param('id') sessionId: string, @CurrentUser() user: any) {
    try {
      const session = await this.sessionsService.completeSession(sessionId, user.uid);
      return serializeSession(session);
    } catch (error) {
      this.logger.error(`Error completing session ${sessionId}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to complete session');
    }
  }
}
