import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { FirestoreService } from '../firebase/services/firestore.service';
import { AuthService } from '../auth/auth.service';
import { AvatarService } from '../progress';
import {
  Session,
  SessionParticipant,
  SessionExercise,
  SetRecord,
} from '../common/interfaces/session.interface';
import { COLLECTIONS } from '../common/constants/firestore.constants';
import { SessionGateway } from '../websocket/session.gateway';
import { SessionExerciseDto, SessionStatus } from './dto';
import { Timestamp } from 'firebase-admin/firestore';
import { serializeOptionalTimestamp } from '../common/utils/serializeSession';

// Custom exceptions for better error handling
export class SessionNotFoundException extends NotFoundException {
  constructor(sessionId: string) {
    super(`Session with ID ${sessionId} not found`);
  }
}

export class UnauthorizedSessionAccessException extends ForbiddenException {
  constructor() {
    super('You are not authorized to access this session');
  }
}

export class InvalidSessionStateException extends ConflictException {
  constructor(message: string) {
    super(message);
  }
}

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly authService: AuthService,
    private readonly sessionGateway: SessionGateway,
    private readonly avatarService: AvatarService,
  ) {}

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return typeof error === 'string' ? error : 'Unknown error';
  }

  /**
   * Creates a new workout session with a friend
   * @param creatorUid - UID of the session creator
   * @param friendUid - UID of the friend to invite
   * @param exercises - Array of exercises with target sets
   * @returns Created Session object
   */
  async createSession(
    creatorUid: string,
    friendUid: string,
    exercises: SessionExerciseDto[],
  ): Promise<Session> {
    if (friendUid === creatorUid) {
      throw new BadRequestException('You cannot create a session with yourself');
    }

    // Validate friend relationship
    const friends = await this.authService.getFriends(creatorUid);
    const isFriend = friends.some((friend) => friend.uid === friendUid);
    if (!isFriend) {
      throw new BadRequestException('You can only create sessions with your friends');
    }

    // Get user display names for participants
    const creatorData = await this.authService.getUserProfile(creatorUid);
    const friendData = await this.authService.getUserProfile(friendUid);

    if (!creatorData || !friendData) {
      throw new BadRequestException('Unable to retrieve user information');
    }

    // Create participants array
    const participants: SessionParticipant[] = [
      {
        uid: creatorUid,
        displayName: creatorData.displayName || 'User',
        status: 'accepted',
      },
      {
        uid: friendUid,
        displayName: friendData.displayName || 'Friend',
        status: 'invited',
      },
    ];

    // Map exercises to SessionExercise format
    const sessionExercises: SessionExercise[] = exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      targetSets: exercise.targetSets,
      completedSets: 0,
    }));

    // Create session document
    const sessionData: Omit<Session, 'id'> = {
      participants,
      participantUids: [creatorUid, friendUid],
      exercises: sessionExercises,
      status: SessionStatus.PENDING,
      currentTurn: creatorUid,
      currentExerciseIndex: 0,
      sets: [],
      createdBy: creatorUid,
      createdAt: Timestamp.now(),
    };

    const docRef = await this.firestoreService.createDocument(COLLECTIONS.SESSIONS, sessionData);

    const session: Session = {
      id: docRef.id,
      ...sessionData,
    };

    this.logger.log(`Session ${docRef.id} created by ${creatorUid} with ${friendUid}`);
    try {
      this.sessionGateway.emitSessionUpdate(session.id, session);
    } catch (error) {
      this.logger.error(
        `WS emit failed after createSession ${session.id}: ${this.getErrorMessage(error)}`,
      );
    }
    return session;
  }

  /**
   * Retrieves a session by ID with authorization check
   * @param sessionId - Session ID
   * @param userId - User ID requesting the session
   * @returns Session object
   */
  async getSessionById(sessionId: string, userId: string): Promise<Session> {
    const docRef = this.firestoreService.getDocument<Session>(COLLECTIONS.SESSIONS, sessionId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new SessionNotFoundException(sessionId);
    }

    const session = docSnap.data() as Session;

    // Validate user is a participant
    if (!session.participantUids.includes(userId)) {
      throw new UnauthorizedSessionAccessException();
    }

    return { ...session, id: sessionId };
  }

  /**
   * Retrieves all sessions for a user with optional status filter
   * @param userId - User ID
   * @param status - Optional status filter
   * @returns Array of Session objects sorted by createdAt descending
   */
  async getUserSessions(userId: string, status?: SessionStatus): Promise<Session[]> {
    let query = this.firestoreService
      .getCollection(COLLECTIONS.SESSIONS)
      .where('participantUids', 'array-contains', userId);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const sessions: Session[] = [];

    snapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...(doc.data() as Omit<Session, 'id'>),
      });
    });

    return sessions;
  }

  /**
   * Accepts or declines a session invitation
   * @param sessionId - Session ID
   * @param userId - User ID accepting/declining
   * @param accepted - Whether to accept or decline
   * @param proposedExercises - Optional exercise modifications proposed by invited user
   * @returns Updated Session object
   */
  async acceptSession(
    sessionId: string,
    userId: string,
    accepted: boolean,
    proposedExercises?: SessionExerciseDto[],
  ): Promise<Session> {
    const session = await this.getSessionById(sessionId, userId);

    const isAwaitingCreatorConfirmation = session.awaitingCreatorConfirmation === true;
    const isPendingStatus = session.status === SessionStatus.PENDING;

    if (
      session.status === SessionStatus.ACTIVE ||
      session.status === SessionStatus.COMPLETED ||
      session.status === SessionStatus.CANCELLED
    ) {
      throw new InvalidSessionStateException(
        `Cannot respond to a session that is ${session.status}`,
      );
    }

    if (!isPendingStatus && !isAwaitingCreatorConfirmation) {
      throw new InvalidSessionStateException(
        'Session is not pending or awaiting creator confirmation',
      );
    }

    // Validate user is the invited participant or the creator confirming proposed exercises
    const participantIndex = session.participants.findIndex((p) => p.uid === userId);
    const isInvitedParticipant =
      participantIndex !== -1 && session.participants[participantIndex].status === 'invited';
    const isCreator = session.createdBy === userId;
    const hasProposedExercises = session.proposedExercises && session.proposedExercises.length > 0;

    if (!isInvitedParticipant && !isCreator) {
      throw new BadRequestException(
        'Only invited participants or creators can accept/decline sessions',
      );
    }

    const updates: Partial<Session> = {};

    // If creator is confirming proposed exercises
    if (isCreator && hasProposedExercises) {
      if (proposedExercises && proposedExercises.length > 0) {
        throw new BadRequestException('Creator cannot propose new exercises when confirming');
      }

      if (accepted) {
        const allAccepted = session.participants.every((p) => p.status === 'accepted');
        if (!allAccepted) {
          throw new BadRequestException(
            'All participants must accept before creator can confirm exercises',
          );
        }
        updates.exercises = session.proposedExercises;
        updates.proposedExercises = undefined;
        updates.awaitingCreatorConfirmation = false;
        updates.status = SessionStatus.ACTIVE;
        updates.startedAt = Timestamp.now();
        updates.participants = session.participants.map((p) => ({
          ...p,
          status: 'active',
        }));
        await this.firestoreService.updateDocument(COLLECTIONS.SESSIONS, sessionId, updates);
        const updatedSession = await this.getSessionById(sessionId, userId);
        this.logger.log(`Session ${sessionId} confirmed and activated by creator ${userId}`);
        try {
          this.sessionGateway.emitSessionStart(sessionId, userId);
          this.sessionGateway.emitSessionUpdate(sessionId, updatedSession);
        } catch (error) {
          this.logger.error(
            `WS emit failed after acceptSession activation ${sessionId}: ${this.getErrorMessage(error)}`,
          );
        }
        return updatedSession;
      }

      updates.proposedExercises = undefined;
      updates.awaitingCreatorConfirmation = false;
      updates.status = SessionStatus.PENDING;
      await this.firestoreService.updateDocument(COLLECTIONS.SESSIONS, sessionId, updates);
      const revertedSession = await this.getSessionById(sessionId, userId);
      this.logger.log(`Session ${sessionId} proposals declined by creator ${userId}`);
      try {
        this.sessionGateway.emitSessionUpdate(sessionId, revertedSession);
      } catch (error) {
        this.logger.error(
          `WS emit failed after proposals declined ${sessionId}: ${this.getErrorMessage(error)}`,
        );
      }
      return revertedSession;
    }

    // Standard invited participant logic
    if (!isInvitedParticipant) {
      throw new BadRequestException('Only invited participants can propose exercise modifications');
    }

    const participantUpdates = session.participants.map((participant, index) => {
      if (index !== participantIndex) {
        return participant;
      }
      return {
        ...participant,
        status: accepted ? 'accepted' : 'declined',
      } as SessionParticipant;
    });

    updates.participants = participantUpdates;

    // If accepted and exercises proposed, store them separately and set confirmation flag
    if (accepted && proposedExercises) {
      const sessionExercises: SessionExercise[] = proposedExercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        targetSets: exercise.targetSets,
        completedSets: 0,
      }));
      updates.proposedExercises = sessionExercises;
      updates.awaitingCreatorConfirmation = true;
    }

    // If both participants accepted and no proposed exercises, start the session
    const allAccepted = participantUpdates.every((p) => p.status === 'accepted');

    if (accepted && allAccepted && !proposedExercises && !session.awaitingCreatorConfirmation) {
      updates.status = SessionStatus.ACTIVE;
      updates.startedAt = Timestamp.now();
      // Set all participant statuses to 'active'
      updates.participants = participantUpdates.map((p) => ({
        ...p,
        status: 'active',
      }));
    } else if (!accepted) {
      updates.status = SessionStatus.CANCELLED;
      updates.participants = participantUpdates.map((p, index) =>
        index === participantIndex ? { ...p, status: 'declined' } : p,
      );
      updates.proposedExercises = undefined;
      updates.awaitingCreatorConfirmation = false;
    }

    await this.firestoreService.updateDocument(COLLECTIONS.SESSIONS, sessionId, updates);

    const updatedSession = await this.getSessionById(sessionId, userId);
    this.logger.log(`Session ${sessionId} ${accepted ? 'accepted' : 'declined'} by ${userId}`);
    try {
      if (updatedSession.status === SessionStatus.ACTIVE) {
        this.sessionGateway.emitSessionStart(sessionId, userId);
      }
      this.sessionGateway.emitSessionUpdate(sessionId, updatedSession);
    } catch (error) {
      this.logger.error(
        `WS emit failed after acceptSession ${sessionId}: ${this.getErrorMessage(error)}`,
      );
    }
    return updatedSession;
  }

  /**
   * Updates session status with validation - supports status transitions
   * @param sessionId - Session ID
   * @param userId - User ID requesting the update
   * @param status - New status (cancelled, active, or completed)
   * @returns Updated Session object
   */
  async updateSessionStatus(
    sessionId: string,
    userId: string,
    status: SessionStatus,
  ): Promise<Session> {
    const session = await this.getSessionById(sessionId, userId);

    // Validate session state transitions
    if (status === SessionStatus.PENDING && session.status !== SessionStatus.PENDING) {
      throw new InvalidSessionStateException('Sessions cannot transition back to pending');
    }

    if (
      status === SessionStatus.CANCELLED &&
      (session.status === SessionStatus.COMPLETED || session.status === SessionStatus.CANCELLED)
    ) {
      throw new InvalidSessionStateException(
        `Cannot cancel a session that is already ${session.status}`,
      );
    }

    if (status === SessionStatus.ACTIVE && session.status !== SessionStatus.PENDING) {
      throw new InvalidSessionStateException('Only pending sessions can be activated');
    }

    if (status === SessionStatus.ACTIVE) {
      const allParticipantsAccepted = session.participants.every(
        (participant) => participant.status === 'accepted',
      );

      if (!allParticipantsAccepted || session.awaitingCreatorConfirmation) {
        throw new InvalidSessionStateException(
          'Session cannot be activated until all participants have accepted',
        );
      }
    }

    if (status === SessionStatus.COMPLETED && session.status !== SessionStatus.ACTIVE) {
      throw new InvalidSessionStateException('Only active sessions can be completed');
    }

    const updates: Partial<Session> = {
      status: status,
    };

    // Set timestamps based on status change
    if (status === SessionStatus.ACTIVE) {
      updates.startedAt = Timestamp.now();
      // Set all participant statuses to 'active'
      updates.participants = session.participants.map((p) => ({
        ...p,
        status: 'active',
      }));
    } else if (status === SessionStatus.COMPLETED) {
      updates.completedAt = Timestamp.now();
    }

    await this.firestoreService.updateDocument(COLLECTIONS.SESSIONS, sessionId, updates);

    const updatedSession = await this.getSessionById(sessionId, userId);
    this.logger.log(`Session ${sessionId} status updated to ${status}`);
    try {
      if (status === SessionStatus.ACTIVE && updatedSession.startedAt) {
        this.sessionGateway.emitSessionStart(sessionId, userId);
      }
      if (status === SessionStatus.COMPLETED && updatedSession.completedAt) {
        // Update avatars for all participants when session completes
        try {
          for (const participantUid of updatedSession.participantUids) {
            const evolution = await this.avatarService.updateAvatarAfterSession(
              participantUid,
              sessionId,
            );
            if (evolution) {
              this.logger.log(
                `Avatar level-up for user ${participantUid}: Level ${evolution.previousLevel} → ${evolution.newLevel}`,
              );
              // Emit avatar evolution WebSocket event
              this.sessionGateway.emitAvatarEvolution(sessionId, participantUid, {
                previousLevel: evolution.previousLevel,
                newLevel: evolution.newLevel,
                muscleGroupsGained: evolution.muscleGroupsGained,
              });
            }
          }
        } catch (error) {
          this.logger.error(
            `Failed to update avatars after manual complete for session ${sessionId}`,
            error,
          );
          // Don't throw - avatar updates shouldn't break session completion
        }

        const completedAtIso = serializeOptionalTimestamp(updatedSession.completedAt);
        if (completedAtIso) {
          this.sessionGateway.emitSessionEnd(sessionId, completedAtIso);
        }
      }
      this.sessionGateway.emitSessionUpdate(sessionId, updatedSession);
    } catch (error) {
      const message = this.getErrorMessage(error);
      this.logger.error(`WS emit failed after updateSessionStatus ${sessionId}: ${message}`);
    }
    return updatedSession;
  }

  /**
   * Records a completed set with automatic turn switching
   * @param sessionId - Session ID
   * @param userId - User ID recording the set
   * @param exerciseId - Exercise ID
   * @param setNumber - Set number
   * @param weight - Weight in kilograms
   * @param reps - Number of repetitions
   * @returns Updated Session object
   */
  async recordSet(
    sessionId: string,
    userId: string,
    exerciseId: string,
    setNumber: number,
    weight: number,
    reps: number,
  ): Promise<Session> {
    let didAdvanceExercise = false;
    const updated = await this.firestoreService.runTransaction(async (transaction) => {
      const sessionRef = this.firestoreService.getDocument(COLLECTIONS.SESSIONS, sessionId);
      const sessionSnap = await transaction.get(sessionRef);

      if (!sessionSnap.exists) {
        throw new SessionNotFoundException(sessionId);
      }

      const session = sessionSnap.data() as Session;

      // Validate user is a participant
      if (!session.participantUids.includes(userId)) {
        throw new UnauthorizedSessionAccessException();
      }

      // Validate session is active
      if (session.status !== SessionStatus.ACTIVE) {
        throw new InvalidSessionStateException('Session must be active to record sets');
      }

      // Validate it's the user's turn
      if (session.currentTurn !== userId) {
        throw new BadRequestException("It's not your turn to record a set");
      }

      const currentExerciseIndex = session.currentExerciseIndex;
      const previousExerciseIndex = currentExerciseIndex;
      if (
        !Number.isInteger(currentExerciseIndex) ||
        currentExerciseIndex < 0 ||
        currentExerciseIndex >= session.exercises.length
      ) {
        throw new InvalidSessionStateException('Invalid current exercise index');
      }

      // Validate exerciseId is the current exercise
      const currentExerciseCheck = session.exercises[currentExerciseIndex];
      if (exerciseId !== currentExerciseCheck.exerciseId) {
        throw new BadRequestException('Not the current exercise');
      }

      // Find the exercise
      const exerciseIndex = session.exercises.findIndex((e) => e.exerciseId === exerciseId);
      if (exerciseIndex === -1) {
        throw new BadRequestException('Exercise not found in session');
      }

      // Count user's sets for this exercise
      const userSetsForExercise = session.sets.filter(
        (s) => s.exerciseId === exerciseId && s.participantUid === userId,
      ).length;

      // Validate not exceeding target sets
      if (userSetsForExercise >= session.exercises[exerciseIndex].targetSets) {
        throw new BadRequestException(
          'You have already completed the target number of sets for this exercise',
        );
      }

      // Validate setNumber is correct (next expected)
      const expectedSetNumber = userSetsForExercise + 1;
      if (setNumber !== expectedSetNumber) {
        throw new BadRequestException(
          `Invalid set number. Expected ${expectedSetNumber}, got ${setNumber}`,
        );
      }

      // Create set record
      const setRecord: SetRecord = {
        participantUid: userId,
        exerciseId,
        setNumber,
        weight,
        reps,
        completedAt: Timestamp.now(),
      };

      // Update sets array
      const updatedSets = [...session.sets, setRecord];

      // Increment completed sets for the exercise
      const updatedExercises = [...session.exercises];
      updatedExercises[exerciseIndex].completedSets++;

      // Determine next turn
      const otherParticipant = session.participantUids.find((uid) => uid !== userId);
      if (!otherParticipant) {
        throw new BadRequestException('Cannot determine other participant');
      }
      let currentExerciseIndexToUpdate = currentExerciseIndex;
      const nextTurn: string = otherParticipant;

      // Check if all sets for current exercise are completed
      const currentExercise = updatedExercises[currentExerciseIndexToUpdate];
      const userSetsAfterRecord = updatedSets.filter(
        (s) => s.exerciseId === currentExercise.exerciseId && s.participantUid === userId,
      ).length;
      const partnerSetsForExercise = updatedSets.filter(
        (s) => s.exerciseId === currentExercise.exerciseId && s.participantUid === otherParticipant,
      ).length;

      // If both users have completed target sets for current exercise, move to next
      const willAdvanceExercise =
        userSetsAfterRecord >= currentExercise.targetSets &&
        partnerSetsForExercise >= currentExercise.targetSets;
      if (willAdvanceExercise) {
        if (currentExerciseIndexToUpdate + 1 < updatedExercises.length) {
          currentExerciseIndexToUpdate += 1;
        } else {
          currentExerciseIndexToUpdate = Math.max(updatedExercises.length - 1, 0);
        }
      }

      const indexChanged = currentExerciseIndexToUpdate !== previousExerciseIndex;
      didAdvanceExercise = indexChanged;

      const updates: Partial<Session> = {
        sets: updatedSets,
        exercises: updatedExercises,
        currentTurn: nextTurn,
        currentExerciseIndex: currentExerciseIndexToUpdate,
      };

      // Check if session is complete
      const allExercisesComplete = updatedExercises.every(
        (exercise) => exercise.completedSets >= exercise.targetSets * 2, // Both participants
      );

      if (allExercisesComplete) {
        updates.status = SessionStatus.COMPLETED;
        updates.completedAt = Timestamp.now();
      }

      transaction.update(sessionRef, updates);

      const updatedSession = { ...session, ...updates } as Session;
      return { ...updatedSession, id: sessionId } as Session & { __advanced?: boolean };
    });
    const updatedSession = updated as Session;
    this.logger.log(`Set recorded for session ${sessionId} by ${userId}`);
    try {
      this.sessionGateway.emitSessionUpdate(sessionId, updatedSession);
      // Only emit exercise change if index advanced
      if (didAdvanceExercise) {
        const idx = updatedSession.currentExerciseIndex;
        const exercise = updatedSession.exercises[idx];
        if (exercise) {
          this.sessionGateway.emitExerciseChange(
            sessionId,
            idx,
            exercise.exerciseId,
            exercise.exerciseName,
          );
        }
      }
      if (updatedSession.status === SessionStatus.COMPLETED && updatedSession.completedAt) {
        // Update avatars for all participants when session completes
        try {
          for (const participantUid of updatedSession.participantUids) {
            const evolution = await this.avatarService.updateAvatarAfterSession(
              participantUid,
              sessionId,
            );
            if (evolution) {
              this.logger.log(
                `Avatar level-up for user ${participantUid}: Level ${evolution.previousLevel} → ${evolution.newLevel}`,
              );
              // Emit avatar evolution WebSocket event
              this.sessionGateway.emitAvatarEvolution(sessionId, participantUid, {
                previousLevel: evolution.previousLevel,
                newLevel: evolution.newLevel,
                muscleGroupsGained: evolution.muscleGroupsGained,
              });
            }
          }
        } catch (error) {
          this.logger.error(
            `Failed to update avatars after auto-complete for session ${sessionId}`,
            error,
          );
          // Don't throw - avatar updates shouldn't break session completion
        }

        const completedAtIso = serializeOptionalTimestamp(updatedSession.completedAt);
        if (completedAtIso) {
          this.sessionGateway.emitSessionEnd(sessionId, completedAtIso);
        }
      }
    } catch (error) {
      const message = this.getErrorMessage(error);
      this.logger.error(`WS emit failed after recordSet ${sessionId}: ${message}`);
    }
    return updatedSession;
  }

  /**
   * Manually switches turn to the other participant
   * @param sessionId - Session ID
   * @param userId - User ID requesting the switch
   * @returns Updated Session object
   */
  async switchTurn(sessionId: string, userId: string): Promise<Session> {
    const updatedSession = await this.firestoreService.runTransaction(async (transaction) => {
      const sessionRef = this.firestoreService.getDocument(COLLECTIONS.SESSIONS, sessionId);
      const sessionSnap = await transaction.get(sessionRef);

      if (!sessionSnap.exists) {
        throw new SessionNotFoundException(sessionId);
      }

      const session = sessionSnap.data() as Session;

      if (!session.participantUids.includes(userId)) {
        throw new UnauthorizedSessionAccessException();
      }

      if (session.status !== SessionStatus.ACTIVE) {
        throw new InvalidSessionStateException('Session must be active to switch turns');
      }

      if (session.currentTurn !== userId) {
        throw new ForbiddenException('Only the current turn holder can switch turns');
      }

      const otherParticipant = session.participantUids.find((uid) => uid !== session.currentTurn);

      if (!otherParticipant) {
        throw new BadRequestException('Cannot determine other participant');
      }

      transaction.update(sessionRef, {
        currentTurn: otherParticipant,
      });

      const sessionWithUpdatedTurn: Session = {
        ...session,
        currentTurn: otherParticipant,
      };

      return { ...sessionWithUpdatedTurn, id: sessionId };
    });

    this.logger.log(
      `Turn switched from ${userId} to ${updatedSession.currentTurn} in session ${sessionId}`,
    );
    try {
      this.sessionGateway.emitSessionUpdate(sessionId, updatedSession);
    } catch (error) {
      const message = this.getErrorMessage(error);
      this.logger.error(`WS emit failed after switchTurn ${sessionId}: ${message}`);
    }
    return updatedSession;
  }

  /**
   * Completes a session early
   * @param sessionId - Session ID
   * @param userId - User ID requesting completion
   * @returns Completed Session object
   */
  async completeSession(sessionId: string, userId: string): Promise<Session> {
    const session = await this.getSessionById(sessionId, userId);

    // Validate session is active
    if (session.status !== SessionStatus.ACTIVE) {
      throw new InvalidSessionStateException('Only active sessions can be completed');
    }

    await this.firestoreService.updateDocument(COLLECTIONS.SESSIONS, sessionId, {
      status: SessionStatus.COMPLETED,
      completedAt: Timestamp.now(),
    });

    const updatedSession = await this.getSessionById(sessionId, userId);
    this.logger.log(`Session ${sessionId} completed by ${userId}`);

    // Trigger avatar update after session completion
    // Avatar updates are non-critical - failures should be logged but not thrown
    try {
      const evolution = await this.avatarService.updateAvatarAfterSession(userId, sessionId);
      if (evolution) {
        this.logger.log(
          `Avatar level-up for user ${userId}: Level ${evolution.previousLevel} → ${evolution.newLevel}`,
        );
        // Emit avatar evolution WebSocket event for immediate client feedback
        this.sessionGateway.emitAvatarEvolution(sessionId, userId, {
          previousLevel: evolution.previousLevel,
          newLevel: evolution.newLevel,
          muscleGroupsGained: evolution.muscleGroupsGained,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to update avatar for user ${userId} after session ${sessionId}`,
        error,
      );
      // Don't throw - avatar updates shouldn't break session completion
    }
    try {
      const completedAtIso = serializeOptionalTimestamp(updatedSession.completedAt);
      if (completedAtIso) {
        this.sessionGateway.emitSessionEnd(sessionId, completedAtIso);
      }
      this.sessionGateway.emitSessionUpdate(sessionId, updatedSession);
    } catch (error) {
      const message = this.getErrorMessage(error);
      this.logger.error(`WS emit failed after completeSession ${sessionId}: ${message}`);
    }
    return updatedSession;
  }
}
