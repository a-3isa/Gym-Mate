import React from 'react';

export interface SessionSocketContextType {
  connected: boolean;
  connect: (sessionId: string) => Promise<void>;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

export const SessionSocketContext = React.createContext<SessionSocketContextType | undefined>(
  undefined,
);

export default SessionSocketContext;


