import { useEffect, useRef, useState } from 'react';
import { ChatMessage, EncryptedChatMessage, GroupPresence, GroupPresenceMember } from '../@types';
import { normalizeChatMessage } from '../shared/message-crypto';
import { getSocket } from './socket';

/**
 * Connects to the chat gateway, joins the given group's room, and keeps
 * `isConnected` in sync. `onMessage` fires for every `newMessage` event
 * broadcast to the room (including ones sent by the current user).
 */
export const useChatSocket = (groupId: string | undefined, onMessage: (message: ChatMessage) => void, onError: (msg: string) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupPresenceMember[]>([]);
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

    setGroupMembers([]);

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('joinGroup', { groupId });
    };
    const handleDisconnect = () => setIsConnected(false);
    const handleGroupPresence = (presence: GroupPresence) => {
      if (presence?.groupId === groupId) {
        setGroupMembers(presence.members || []);
      }
    };
    const handlePresenceChanged = (payload: { userId?: string; isOnline?: boolean }) => {
      if (!payload?.userId) return;
      setGroupMembers((members) =>
        members.map((member) =>
          member.userId === payload.userId
            ? { ...member, isOnline: Boolean(payload.isOnline) }
            : member
        )
      );
    };
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
    socket.on('groupPresence', handleGroupPresence);
    socket.on('presenceChanged', handlePresenceChanged);
    const failureEvents = ['error', 'authFailed', 'joinGroupFailed', 'getGroupPresenceFailed', 'sendMessageFailed'];
    failureEvents.forEach((event) => socket.on(event, handleError));

    if (socket.connected) handleConnect();
    else socket.connect();

    return () => {
      isActive = false;
      socket.emit('leaveGroupRoom', { groupId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('newMessage', handleNewMessage);
      socket.off('groupPresence', handleGroupPresence);
      socket.off('presenceChanged', handlePresenceChanged);
      failureEvents.forEach((event) => socket.off(event, handleError));
      socket.disconnect();
      setIsConnected(false);
    };
  }, [groupId]);

  const sendMessage = (message: string) => {
    socketRef.current?.emit('sendMessage', { groupId, message: { text: message } });
  };

  const refreshGroupPresence = () => {
    if (groupId) socketRef.current?.emit('getGroupPresence', { groupId });
  };

  return {
    isConnected,
    activeMembers: groupMembers.filter((member) => member.isOnline),
    groupMembers,
    refreshGroupPresence,
    sendMessage
  };
};
