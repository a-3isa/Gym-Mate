import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import SessionSocketContext from './SessionSocketContext';
import socketService from '../services/socket/socket.service';
import useAuth from '../hooks/useAuth';
import { SOCKET_EVENTS } from '../utils/constants';
import { BACKEND_API_URL } from '@env';

const SessionSocketProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const connect = useCallback(async (sessionId: string) => {
    try {
      // Early return if already connected to the same session
      if (socketService.isConnected() && currentSessionId === sessionId) {
        return;
      }
      
      // If switching sessions, emit leave for the old session first
      if (currentSessionId && currentSessionId !== sessionId) {
        socketService.emit(SOCKET_EVENTS.SESSION_LEAVE, { sessionId: currentSessionId });
      }
      
      setCurrentSessionId(sessionId);
      await socketService.connect(BACKEND_API_URL);
      // Set initial state explicitly after connect
      setConnected(socketService.isConnected());
      
      // Remove any existing handlers to prevent duplicates
      socketService.off('connect');
      socketService.off('disconnect');
      socketService.off('connect_error');
      
      // Event-driven connection state updates
      socketService.on('connect', () => {
        setConnected(true);
        // Join session room on connect (initial or reconnect)
        socketService.emit(SOCKET_EVENTS.SESSION_JOIN, { sessionId });
      });
      socketService.on('disconnect', () => setConnected(false));
      socketService.on('connect_error', () => {
        setConnected(false);
      });
      // Fast path: if already connected, join immediately
      if (socketService.isConnected()) {
        socketService.emit(SOCKET_EVENTS.SESSION_JOIN, { sessionId });
      }
    } catch (e) {
      Alert.alert('Connection Error', 'Failed to connect to session');
    }
  }, [currentSessionId]);

  const disconnect = useCallback(() => {
    if (currentSessionId) {
      socketService.emit(SOCKET_EVENTS.SESSION_LEAVE, { sessionId: currentSessionId });
    }
    socketService.disconnect();
    setConnected(false);
    setCurrentSessionId(null);
  }, [currentSessionId]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      disconnect();
    };
  }, [disconnect]);

  const value = useMemo(
    () => ({
      connected,
      connect,
      disconnect,
      emit: socketService.emit.bind(socketService),
      on: socketService.on.bind(socketService),
      off: socketService.off.bind(socketService),
    }),
    [connected, connect, disconnect],
  );

  return <SessionSocketContext.Provider value={value}>{children}</SessionSocketContext.Provider>;
};

export default SessionSocketProvider;


