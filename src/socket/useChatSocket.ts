import { useEffect, useRef, useState } from 'react';
import { ChatMessage, EncryptedChatMessage } from '../@types';
import { normalizeChatMessage } from '../shared/message-crypto';
import { getSocket } from './socket';

/**
 * Connects to the chat gateway, joins the given group's room, and keeps
 * `isConnected` in sync. `onMessage` fires for every `newMessage` event
 * broadcast to the room (including ones sent by the current user).
 */
export const useChatSocket = (groupId: string | undefined, onMessage: (message: ChatMessage) => void, onError: (msg: string) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(getSocket());
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

  useEffect(() => {
    if (!groupId) return;
    const socket = getSocket();
    socketRef.current = socket;
    const expectedChatId = `group:${groupId}`;
    let messageQueue = Promise.resolve();
    let isActive = true;

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('joinGroup', { groupId });
    };
    const handleDisconnect = () => setIsConnected(false);
    const handleNewMessage = (message: EncryptedChatMessage) => {
      const belongsToGroup = message.chatId
        ? message.chatId === expectedChatId
        : message.groupId === groupId;
      if (!belongsToGroup) return;

      messageQueue = messageQueue.then(async () => {
        const normalized = await normalizeChatMessage(message);
        if (isActive) onMessageRef.current(normalized);
      });
    };
    const handleError = (payload: { message?: string }) => {
      onErrorRef.current(payload?.message || 'A real-time connection error occurred.');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('newMessage', handleNewMessage);
    socket.on('error', handleError);

    if (socket.connected) handleConnect();
    else socket.connect();

    return () => {
      isActive = false;
      socket.emit('leaveGroup', { groupId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('newMessage', handleNewMessage);
      socket.off('error', handleError);
      socket.disconnect();
      setIsConnected(false);
    };
  }, [groupId]);

  const sendMessage = (message: string) => {
    socketRef.current?.emit('sendMessage', { groupId, message: { text: message } });
  };

  return { isConnected, sendMessage };
};
