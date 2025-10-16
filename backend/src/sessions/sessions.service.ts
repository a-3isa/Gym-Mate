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
import {
  Session,
  SessionParticipant,
  SessionExercise,
  SetRecord,
} from '../common/interfaces/session.interface';
import { COLLECTIONS } from '../common/constants/firestore.constants';
import { SessionExerciseDto, SessionStatus } from './dto';
import { Timestamp } from 'firebase-admin/firestore';

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
  ) {}

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
      status: 'pending',
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
  async getUserSessions(userId: string, status?: string): Promise<Session[]> {
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

    // Validate user is the invited participant or the creator confirming proposed exercises
    const participantIndex = session.participants.findIndex((p) => p.uid === userId);
    const isInvitedParticipant =
      participantIndex !== -1 && session.participants[participantIndex].status === 'invited';
    const isCreator = session.createdBy === userId;
    const hasProposedExercises = session.exercises && session.exercises.length > 0; // Assuming proposedExercises are stored in exercises

    if (!isInvitedParticipant && !isCreator) {
      throw new BadRequestException(
        'Only invited participants or creators can accept/decline sessions',
      );
    }

    const updates: Partial<Session> = {};

    // If creator is confirming proposed exercises
    if (isCreator && !proposedExercises && hasProposedExercises) {
      // Creator is confirming the proposed exercises
      const allAccepted = session.participants.every((p) => p.status === 'accepted');
      if (!allAccepted) {
        throw new BadRequestException(
          'All participants must accept before creator can confirm exercises',
        );
      }
      updates.status = 'active';
      updates.startedAt = Timestamp.now();
      updates.participants = session.participants.map((p) => ({
        ...p,
        status: 'active',
      }));
      await this.firestoreService.updateDocument(COLLECTIONS.SESSIONS, sessionId, updates);
      const updatedSession = await this.getSessionById(sessionId, userId);
      this.logger.log(`Session ${sessionId} confirmed and activated by creator ${userId}`);
      return updatedSession;
    }

    // Standard invited participant logic
    if (!isInvitedParticipant) {
      throw new BadRequestException('Only invited participants can propose exercise modifications');
    }

    // Update participant status
    session.participants[participantIndex].status = accepted ? 'accepted' : 'declined';

    updates.participants = session.participants;

    // If accepted and exercises proposed, update exercises (requires creator confirmation in UI)
    if (accepted && proposedExercises) {
      const sessionExercises: SessionExercise[] = proposedExercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        targetSets: exercise.targetSets,
        completedSets: 0,
      }));
      updates.exercises = sessionExercises;
    }

    // If both participants accepted, start the session
    const allAccepted = session.participants.every((p) => p.status === 'accepted');

    if (accepted && allAccepted && !proposedExercises) {
      updates.status = 'active';
      updates.startedAt = Timestamp.now();
      // Set all participant statuses to 'active'
      updates.participants = session.participants.map((p) => ({
        ...p,
        status: 'active',
      }));
    } else if (!accepted) {
      updates.status = 'cancelled';
    }

    await this.firestoreService.updateDocument(COLLECTIONS.SESSIONS, sessionId, updates);

    const updatedSession = await this.getSessionById(sessionId, userId);
    this.logger.log(`Session ${sessionId} ${accepted ? 'accepted' : 'declined'} by ${userId}`);
    return updatedSession;
  }

  /**
   * Updates session status with validation - only allows cancelling sessions
   * @param sessionId - Session ID
   * @param userId - User ID requesting the update
   * @param status - New status (must be 'cancelled')
   * @returns Updated Session object
   */
  async updateSessionStatus(
    sessionId: string,
    userId: string,
    status: SessionStatus,
  ): Promise<Session> {
    const session = await this.getSessionById(sessionId, userId);

    // Only allow cancelling sessions
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison */
    if (status !== 'cancelled') {
      throw new BadRequestException(
        'Only session cancellation is allowed via this endpoint. Use acceptSession() for activation or completeSession() for completion.',
      );
    }

    // Validate session is not already completed or cancelled
    if (session.status === 'completed' || session.status === 'cancelled') {
      throw new InvalidSessionStateException(
        `Cannot cancel a session that is already ${session.status}`,
      );
    }

    const updates: Partial<Session> = {
      status: status as Session['status'],
    };

    await this.firestoreService.updateDocument(COLLECTIONS.SESSIONS, sessionId, updates);

    const updatedSession = await this.getSessionById(sessionId, userId);
    this.logger.log(`Session ${sessionId} status updated to ${status}`);
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
    const updatedSession = await this.firestoreService.runTransaction(async (transaction) => {
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
      if (session.status !== 'active') {
        throw new InvalidSessionStateException('Session must be active to record sets');
      }

      // Validate it's the user's turn
      if (session.currentTurn !== userId) {
        throw new BadRequestException("It's not your turn to record a set");
      }

      // Validate exerciseId is the current exercise
      const currentExerciseCheck = session.exercises[session.currentExerciseIndex];
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
      let currentExerciseIndex = session.currentExerciseIndex;

      // Check if all sets for current exercise are completed
      const currentExercise = updatedExercises[currentExerciseIndex];
      const userSetsAfterRecord = updatedSets.filter(
        (s) => s.exerciseId === currentExercise.exerciseId && s.participantUid === userId,
      ).length;
      const partnerSetsForExercise = updatedSets.filter(
        (s) => s.exerciseId === currentExercise.exerciseId && s.participantUid === otherParticipant,
      ).length;

      // If both users have completed target sets for current exercise, move to next
      if (
        userSetsAfterRecord >= currentExercise.targetSets &&
        partnerSetsForExercise >= currentExercise.targetSets
      ) {
        currentExerciseIndex++;
      }

      const updates: Partial<Session> = {
        sets: updatedSets,
        exercises: updatedExercises,
        currentTurn: otherParticipant,
        currentExerciseIndex,
      };

      // Check if session is complete
      const allExercisesComplete = updatedExercises.every(
        (exercise) => exercise.completedSets >= exercise.targetSets * 2, // Both participants
      );

      if (allExercisesComplete) {
        updates.status = 'completed';
        updates.completedAt = Timestamp.now();
      }

      transaction.update(sessionRef, updates);

      // Return the updated session
      const updatedSessionSnap = await transaction.get(sessionRef);
      const updatedSession = updatedSessionSnap.data() as Session;
      return { ...updatedSession, id: sessionId };
    });
    this.logger.log(`Set recorded for session ${sessionId} by ${userId}`);
    return updatedSession;
  }

  /**
   * Manually switches turn to the other participant
   * @param sessionId - Session ID
   * @param userId - User ID requesting the switch
   * @returns Updated Session object
   */
  async switchTurn(sessionId: string, userId: string): Promise<Session> {
    const session = await this.getSessionById(sessionId, userId);

    // Validate session is active
    if (session.status !== 'active') {
      throw new InvalidSessionStateException('Session must be active to switch turns');
    }

    // Validate that only the current turn holder can switch turns
    if (session.currentTurn !== userId) {
      throw new ForbiddenException('Only the current turn holder can switch turns');
    }

    // Toggle to other participant
    const otherParticipant = session.participantUids.find((uid) => uid !== session.currentTurn);

    if (!otherParticipant) {
      throw new BadRequestException('Cannot determine other participant');
    }

    await this.firestoreService.updateDocument(COLLECTIONS.SESSIONS, sessionId, {
      currentTurn: otherParticipant,
    });

    const updatedSession = await this.getSessionById(sessionId, userId);
    this.logger.log(`Turn switched from ${userId} to ${otherParticipant} in session ${sessionId}`);
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
    if (session.status !== 'active') {
      throw new InvalidSessionStateException('Only active sessions can be completed');
    }

    await this.firestoreService.updateDocument(COLLECTIONS.SESSIONS, sessionId, {
      status: 'completed',
      completedAt: Timestamp.now(),
    });

    const updatedSession = await this.getSessionById(sessionId, userId);
    this.logger.log(`Session ${sessionId} completed by ${userId}`);
    return updatedSession;
  }
}
