import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment';
import { getStoredToken } from '../shared/shared-functions';

let socket: Socket | null = null;

/**
 * Returns a singleton Socket.IO client. The JWT is (re)attached to the
 * `auth` payload every time this is called, so a freshly logged-in user
 * always connects with their current token - verified server-side by
 * ChatGateway.handleConnection.
 */
export const getSocket = (): Socket => {
  const token = getStoredToken();

  if (!socket) {
    socket = io(environment.SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket'],
      autoConnect: false,
      auth: { token }
    });
  } else {
    socket.auth = { token };
  }

  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
