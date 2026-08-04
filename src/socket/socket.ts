import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment';
import { getStoredToken } from '../shared/shared-functions';

let socket: Socket | null = null;

window.addEventListener('auth:tokens-refreshed', ((event: CustomEvent<string>) => {
  if (socket) socket.auth = { token: event.detail };
}) as EventListener);


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
