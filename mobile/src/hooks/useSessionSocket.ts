import { useContext } from 'react';
import SessionSocketContext from '../contexts/SessionSocketContext';

export default function useSessionSocket() {
  const ctx = useContext(SessionSocketContext);
  if (!ctx) {
    throw new Error('useSessionSocket must be used within a SessionSocketProvider');
  }
  return ctx;
}
