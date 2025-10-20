import type { Timestamp } from 'firebase-admin/firestore';
import { Session, SetRecord } from '../interfaces/session.interface';

export type SerializedTimestamp = string;

export const serializeTimestamp = (timestamp: Timestamp): SerializedTimestamp =>
  timestamp.toDate().toISOString();

export const serializeOptionalTimestamp = (
  timestamp?: Timestamp,
): SerializedTimestamp | undefined => (timestamp ? serializeTimestamp(timestamp) : undefined);

export type SerializedSetRecord = Omit<SetRecord, 'completedAt'> & {
  completedAt: SerializedTimestamp;
};

export type SerializedSession = Omit<
  Session,
  'createdAt' | 'startedAt' | 'completedAt' | 'sets'
> & {
  createdAt: SerializedTimestamp;
  startedAt?: SerializedTimestamp;
  completedAt?: SerializedTimestamp;
  sets: SerializedSetRecord[];
};

/**
 * Serializes Firestore Timestamp fields to ISO strings to ensure safe JSON transport.
 * Consolidates timestamp serialization logic for both controller and gateway usage.
 *
 * @param session - Session object with potential Timestamp fields
 * @returns Session with timestamps as ISO strings
 */
export function serializeSession(session: Session): SerializedSession {
  const { createdAt, startedAt, completedAt, sets, ...rest } = session;

  return {
    ...rest,
    createdAt: serializeTimestamp(createdAt),
    startedAt: serializeOptionalTimestamp(startedAt),
    completedAt: serializeOptionalTimestamp(completedAt),
    sets: sets.map((set) => ({
      ...set,
      completedAt: serializeTimestamp(set.completedAt),
    })),
  };
}
