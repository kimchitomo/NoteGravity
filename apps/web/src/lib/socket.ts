import { io, Socket } from 'socket.io-client';

// In development, bypass Vite proxy to avoid ECONNRESET and connect directly to backend
const isProd = (import.meta as any).env.PROD;

// By using undefined, socket.io automatically uses the current origin (window.location)
// In development, Vite proxy handles routing it to port 3000 safely
const URL = undefined;

export const socket: Socket = io(URL, {
  autoConnect: true,
  reconnection: true,
});

export const initSocketListeners = () => {
  socket.on('connect', () => {
    console.log('Connected to sync server:', socket.id);
    
    // Request initial sync if this is the first time or we just reconnected
    // socket.emit('request_initial_sync');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from sync server');
  });
};
