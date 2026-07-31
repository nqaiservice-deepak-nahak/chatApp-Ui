import { ArrowLeftOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Avatar, Badge, Button, Input, Layout, Spin, Typography } from 'antd';
import { UIEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clearAuthError, fetchAvailableUsersThunk } from '../../../redux/features/auth/auth.slice';
import {
  appendPrivateMessage,
  clearMessagesError,
  clearPrivateChatHistory,
  fetchChatsThunk,
  fetchPrivateChatHistoryThunk
} from '../../../redux/features/messages/messages.slice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { parseApiDate } from '../../../shared/shared-functions';
import { usePrivateChatSocket } from '../../../socket/usePrivateChatSocket';
import '../Chat/chatScreen.css';
import './directChat.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function DirectChatScreen() {
  const { userId } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { availableUsers, usersLoading, error: authError } = useAppSelector((state) => state.auth);
  const {
    privateChatHistory,
    historyLoading,
    olderHistoryLoading,
    privateHasMore,
    privateNextOffset,
    chatList,
    chatsLoading,
    error
  } = useAppSelector((state) => state.messages);
  const directConversation = chatList.find(
    (conversation) => conversation.chatType === 'private' && conversation.id === userId
  );
  const otherUser =
    availableUsers.find((candidate) => candidate.id === userId) ||
    (directConversation?.directDetails
      ? {
          id: directConversation.directDetails.otherUserId,
          name: directConversation.directDetails.otherUserName,
          email: directConversation.directDetails.otherUserEmail
        }
      : undefined);
  const [draft, setDraft] = useState('');
  const [socketError, setSocketError] = useState('');
  const contentRef = useRef<HTMLElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const loadingOlderRef = useRef(false);

  const handleIncomingMessage = useCallback(
    (message: Parameters<typeof appendPrivateMessage>[0]) => dispatch(appendPrivateMessage(message)),
    [dispatch]
  );
  const handleSocketError = useCallback((message: string) => setSocketError(message), []);
  const { isConnected, sendPrivateMessage } = usePrivateChatSocket(userId, handleIncomingMessage, handleSocketError);

  useEffect(() => {
    if (!availableUsers.length) dispatch(fetchAvailableUsersThunk());
  }, [availableUsers.length, dispatch]);

  useEffect(() => {
    if (!chatList.length) dispatch(fetchChatsThunk());
  }, [chatList.length, dispatch]);

  useEffect(() => {
    if (!userId) return;
    dispatch(fetchPrivateChatHistoryThunk({ userId }));
    return () => {
      dispatch(clearPrivateChatHistory());
    };
  }, [dispatch, userId]);

  useEffect(() => {
    if (!loadingOlderRef.current) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [privateChatHistory]);

  const handleHistoryScroll = async (event: UIEvent<HTMLElement>) => {
    const container = event.currentTarget;
    if (
      container.scrollTop > 40 ||
      !userId ||
      !privateHasMore ||
      privateNextOffset === null ||
      olderHistoryLoading ||
      loadingOlderRef.current
    ) {
      return;
    }

    loadingOlderRef.current = true;
    const previousScrollHeight = container.scrollHeight;

    try {
      await dispatch(fetchPrivateChatHistoryThunk({ userId, offset: privateNextOffset })).unwrap();
      requestAnimationFrame(() => {
        const currentContainer = contentRef.current;
        if (currentContainer) {
          currentContainer.scrollTop = currentContainer.scrollHeight - previousScrollHeight;
        }
        loadingOlderRef.current = false;
      });
    } catch {
      loadingOlderRef.current = false;
    }
  };

  const handleSend = () => {
    const message = draft.trim();
    if (!message || !isConnected) return;
    sendPrivateMessage(message);
    setDraft('');
  };

  const formatTime = (date: string) =>
    parseApiDate(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Layout className="chat-screen direct-chat-screen">
      <Header className="chat-header">
        <div className="chat-left">
          <Button
            type="text"
            aria-label="Back to dashboard"
            icon={<ArrowLeftOutlined />}
            className="back-btn"
            onClick={() => navigate('/dashboard')}
          />
          <Avatar size={50} className="chat-avatar direct-avatar" icon={<UserOutlined />} />
          <div className="chat-header-info">
            <Title level={4} className="chat-title">
              {otherUser?.name || (usersLoading || chatsLoading ? 'Loading conversation…' : 'Direct message')}
            </Title>
            <div className="chat-status">
              <Badge status={isConnected ? 'success' : 'warning'} />
              <Text>{isConnected ? 'Online connection active' : 'Reconnecting…'}</Text>
            </div>
          </div>
        </div>
        {otherUser && <Text className="direct-email">{otherUser.email}</Text>}
      </Header>

      {(socketError || error || authError) && (
        <Alert
          type="error"
          message={socketError || error || authError}
          showIcon
          closable
          className="chat-alert"
          onClose={() => {
            setSocketError('');
            dispatch(clearMessagesError());
            dispatch(clearAuthError());
          }}
        />
      )}

      <Content ref={contentRef} className="chat-content" onScroll={handleHistoryScroll}>
        {olderHistoryLoading && (
          <div className="history-page-loader"><Spin size="small" /></div>
        )}
        {historyLoading ? (
          <div className="chat-loader"><Spin size="large" /></div>
        ) : privateChatHistory.length === 0 ? (
          <div className="empty-chat">
            <Avatar size={80} className="empty-avatar direct-avatar" icon={<UserOutlined />} />
            <Title level={4}>Start a private conversation</Title>
            <Text>Your messages are visible only to you and {otherUser?.name || 'this person'}.</Text>
          </div>
        ) : (
          privateChatHistory.map((message) => {
            const isMine = message.senderId === currentUser?.id;
            return (
              <div key={message._id} className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
                {!isMine && <Avatar className="message-avatar direct-avatar" icon={<UserOutlined />} />}
                <div className="message-bubble">
                  <div className="message-header">
                    <span className="message-sender">{isMine ? 'You' : message.senderName}</span>
                    <span className="message-time">{formatTime(message.createdOn)}</span>
                  </div>
                  <div className="message-text">{message.message}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </Content>

      <Footer className="chat-footer">
        <Input
          value={draft}
          maxLength={4000}
          showCount
          onChange={(event) => setDraft(event.target.value)}
          onPressEnter={handleSend}
          placeholder={`Message ${otherUser?.name || 'privately'}…`}
          className="chat-input"
          disabled={!isConnected}
          aria-label="Private message"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          className="send-btn"
          disabled={!draft.trim() || !isConnected}
          onClick={handleSend}
        >
          Send
        </Button>
      </Footer>
    </Layout>
  );
}
