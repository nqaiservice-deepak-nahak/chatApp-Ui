import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatMessage, EncryptedChatMessage } from '../@types';
import { normalizeChatMessage } from '../shared/message-crypto';
import { getStoredUser } from '../shared/shared-functions';
import { getSocket } from './socket';

export const usePrivateChatSocket = (
  otherUserId: string | undefined,
  onMessage: (message: ChatMessage) => void,
  onError: (message: string) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
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
    const currentUserId = getStoredUser()?.id;
    const expectedChatId = currentUserId
      ? `direct:${[currentUserId, otherUserId].sort().join(':')}`
      : null;
    let messageQueue = Promise.resolve();
    let isActive = true;

    const joinConversation = () => {
      setIsConnected(true);
      socket.emit('joinPrivateChat', { userId: otherUserId });
      socket.emit('checkUserPresence', { userId: otherUserId });
    };
    const handleDisconnect = () => {
      setIsConnected(false);
      setIsOtherUserOnline(false);
    };
    const handlePresence = (payload: { userId?: string; isOnline?: boolean }) => {
      if (payload?.userId === otherUserId) {
        setIsOtherUserOnline(Boolean(payload.isOnline));
      }
    };
    const handleMessage = (message: EncryptedChatMessage) => {
      const belongsToConversation = message.chatId
        ? !expectedChatId || message.chatId === expectedChatId
        : message.senderId === otherUserId || message.receiverId === otherUserId;
      if (!belongsToConversation) return;

      messageQueue = messageQueue.then(async () => {
        const normalized = await normalizeChatMessage(message);
        if (isActive) {
          onMessageRef.current(normalized);
          if (normalized.senderId === otherUserId) {
            socket.emit('markPrivateChatRead', { userId: otherUserId });
          }
        }
      });
    };
    const handleError = (payload: { message?: string }) => {
      onErrorRef.current(payload?.message || 'The real-time connection encountered an error.');
    };

    socket.on('connect', joinConversation);
    socket.on('disconnect', handleDisconnect);
    socket.on('newPrivateMessage', handleMessage);
    socket.on('userPresence', handlePresence);
    socket.on('presenceChanged', handlePresence);
    socket.on('error', handleError);

    if (socket.connected) joinConversation();
    else socket.connect();

    return () => {
      isActive = false;
      socket.off('connect', joinConversation);
      socket.off('disconnect', handleDisconnect);
      socket.off('newPrivateMessage', handleMessage);
      socket.off('userPresence', handlePresence);
      socket.off('presenceChanged', handlePresence);
      socket.off('error', handleError);
      socket.disconnect();
      setIsConnected(false);
    };
  }, [otherUserId]);

  const sendPrivateMessage = useCallback(
    (message: string) => {
      if (otherUserId) {
        socketRef.current.emit('sendPrivateMessage', {
          receiverId: otherUserId,
          message: { text: message }
        });
      }
    },
    [otherUserId]
  );

  return { isConnected, isOtherUserOnline, sendPrivateMessage };
};
