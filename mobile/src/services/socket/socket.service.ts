import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { auth } from '../firebase/auth';

/**
 * SocketService manages a single Socket.IO connection lifecycle.
 * It handles authentication, reconnection, and listener registration.
 */
class SocketService {
  private socket: Socket | null = null;
  private connected = false;
  private listeners = new Map<string, Set<(...args: any[]) => void>>();
  private reconnectAttempts = 0;
  private baseApiUrl: string = '';

  private getBaseUrl(apiUrl: string): string {
    // Replace trailing /api for websocket namespace base
    return apiUrl.replace(/\/?api\/?$/, '');
  }

  private async createSocketWithListeners(wsUrl: string, token: string): Promise<Socket> {
    const socket = io(wsUrl, {
      transports: ['websocket'],
      query: { token },
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 10000,
    });

    // Re-register all event listeners on the new socket
    this.listeners.forEach((cbs, evt) => cbs.forEach((cb) => socket.on(evt, cb)));

    // Re-bind internal handlers
    socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
    });

    socket.on('disconnect', () => {
      this.connected = false;
    });

    socket.on('connect_error', async () => {
      this.connected = false;
      this.reconnectAttempts += 1;

      // Try to refresh token and reconnect
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const newToken = await currentUser.getIdToken(true);
        socket.disconnect();
        this.socket = await this.createSocketWithListeners(wsUrl, newToken);
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    });

    // Handle auth errors from server
    const serverErrorHandler = async (error: any) => {
      if (error?.code === 'AUTH_FAILED') {
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) return;

          const newToken = await currentUser.getIdToken(true);
          socket.disconnect();
          this.socket = await this.createSocketWithListeners(wsUrl, newToken);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
    };

    socket.on('server:error', serverErrorHandler);

    // Store in listeners for persistence across reconnections
    if (!this.listeners.has('server:error')) {
      this.listeners.set('server:error', new Set());
    }
    this.listeners.get('server:error')!.add(serverErrorHandler);

    return socket;
  }

  async connect(baseApiUrl: string): Promise<void> {
    if (this.connected && this.socket) return;

    this.baseApiUrl = baseApiUrl;
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    const token = await currentUser.getIdToken();
    const wsUrl = `${this.getBaseUrl(baseApiUrl)}/sessions`;

    this.socket = await this.createSocketWithListeners(wsUrl, token);
  }

  disconnect(): void {
    if (!this.socket) return;
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => this.socket?.off(event, cb));
    });
    this.listeners.clear();
    this.socket.disconnect();
    this.socket = null;
    this.connected = false;
  }

  emit(event: string, data?: any): void {
    if (!this.socket || !this.connected) return;
    this.socket.emit(event, data);
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) return;
    this.socket.on(event, callback);
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
      this.listeners.get(event)?.delete(callback);
      return;
    }
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => this.socket?.off(event, cb));
      this.listeners.delete(event);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

const socketService = new SocketService();
export default socketService;
