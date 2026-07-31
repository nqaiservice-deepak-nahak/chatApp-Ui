import { useEffect, useRef } from 'react';
import { getSocket } from './socket';

export const useChatListSocket = (onChatListUpdated: () => void) => {
  const callbackRef = useRef(onChatListUpdated);

  useEffect(() => {
    callbackRef.current = onChatListUpdated;
  }, [onChatListUpdated]);

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => callbackRef.current();

    socket.on('chatListUpdated', handleUpdate);
    if (!socket.connected) socket.connect();

    return () => {
      socket.off('chatListUpdated', handleUpdate);
      socket.disconnect();
    };
  }, []);
};
