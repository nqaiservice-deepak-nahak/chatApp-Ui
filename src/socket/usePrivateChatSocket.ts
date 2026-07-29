import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../@types';
import { getSocket } from './socket';

export const usePrivateChatSocket = (
  otherUserId: string | undefined,
  onMessage: (message: ChatMessage) => void,
  onError: (message: string) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(getSocket());
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

  useEffect(() => {
    if (!otherUserId) return;

    const socket = getSocket();
    socketRef.current = socket;

    const joinConversation = () => {
      setIsConnected(true);
      socket.emit('joinPrivateChat', { userId: otherUserId });
    };
    const handleDisconnect = () => setIsConnected(false);
    const handleMessage = (message: ChatMessage) => {
      const belongsToConversation =
        message.senderId === otherUserId || message.receiverId === otherUserId;
      if (belongsToConversation) onMessageRef.current(message);
    };
    const handleError = (payload: { message?: string }) => {
      onErrorRef.current(payload?.message || 'The real-time connection encountered an error.');
    };

    socket.on('connect', joinConversation);
    socket.on('disconnect', handleDisconnect);
    socket.on('newPrivateMessage', handleMessage);
    socket.on('error', handleError);

    if (socket.connected) joinConversation();
    else socket.connect();

    return () => {
      socket.off('connect', joinConversation);
      socket.off('disconnect', handleDisconnect);
      socket.off('newPrivateMessage', handleMessage);
      socket.off('error', handleError);
      socket.disconnect();
      setIsConnected(false);
    };
  }, [otherUserId]);

  const sendPrivateMessage = useCallback(
    (message: string) => {
      if (otherUserId) {
        socketRef.current.emit('sendPrivateMessage', { receiverId: otherUserId, message });
      }
    },
    [otherUserId]
  );

  return { isConnected, sendPrivateMessage };
};
