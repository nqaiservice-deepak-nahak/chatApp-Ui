import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../@types';
import { getSocket } from './socket';

/**
 * Connects to the chat gateway, joins the given group's room, and keeps
 * `isConnected` in sync. `onMessage` fires for every `newMessage` event
 * broadcast to the room (including ones sent by the current user).
 */
export const useChatSocket = (groupId: string | undefined, onMessage: (message: ChatMessage) => void, onError: (msg: string) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    if (!groupId) return;
    const socket = getSocket();
    socketRef.current = socket;
    socket.connect();

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('joinGroup', { groupId });
    };
    const handleDisconnect = () => setIsConnected(false);
    const handleNewMessage = (message: ChatMessage) => {
      if (message.groupId === groupId) onMessage(message);
    };
    const handleError = (payload: { message: string }) => onError(payload?.message || 'A real-time connection error occurred.');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('newMessage', handleNewMessage);
    socket.on('error', handleError);

    return () => {
      socket.emit('leaveGroup', { groupId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('newMessage', handleNewMessage);
      socket.off('error', handleError);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const sendMessage = (message: string) => {
    socketRef.current?.emit('sendMessage', { groupId, message });
  };

  return { isConnected, sendMessage };
};
