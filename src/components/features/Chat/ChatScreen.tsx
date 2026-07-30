import {
  ArrowLeftOutlined,
  DeleteOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";

import {
  Alert,
  Avatar,
  Badge,
  Button,
  Input,
  Layout,
  Popconfirm,
  Spin,
  Typography,
} from "antd";

import { UIEvent, useEffect, useRef, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  appendMessage,
  clearChatHistory,
  fetchChatHistoryThunk,
} from "../../../redux/features/messages/messages.slice";

import {
  deleteGroupThunk,
  fetchGroupDetailsThunk,
} from "../../../redux/features/groups/groups.slice";

import {
  useAppDispatch,
  useAppSelector,
} from "../../../redux/hooks";

import { useChatSocket } from "../../../socket/useChatSocket";

import "./chatScreen.css";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function ChatScreen() {

  const { groupId } = useParams();

  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const user = useAppSelector((state) => state.auth.user);

  const {
    chatHistory,
    historyLoading,
    olderHistoryLoading,
    chatHasMore,
    chatNextOffset,
    error,
  } = useAppSelector((state) => state.messages);

  const {
    groupDetails,
    deleteLoading,
    error: groupError,
  } = useAppSelector((state) => state.groups);

  const [draft, setDraft] = useState("");

  const [socketError, setSocketError] = useState("");

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  const contentRef =
    useRef<HTMLElement | null>(null);

  const loadingOlderRef =
    useRef(false);

  const {
    isConnected,
    sendMessage,
  } = useChatSocket(

    groupId,

    (message) => {

      dispatch(appendMessage(message));

    },

    (err) => {

      setSocketError(err);

    }
  );

  useEffect(() => {

    if (!groupId) return;

    dispatch(fetchGroupDetailsThunk(groupId));

    dispatch(fetchChatHistoryThunk({ groupId }));

    return () => {

      dispatch(clearChatHistory());

    };

  }, [dispatch, groupId]);

  useEffect(() => {

    if (!loadingOlderRef.current) {

      messagesEndRef.current?.scrollIntoView({

        behavior: "smooth",

      });

    }

  }, [chatHistory]);

  const handleHistoryScroll = async (event: UIEvent<HTMLElement>) => {

    const container = event.currentTarget;

    if (
      container.scrollTop > 40 ||
      !groupId ||
      !chatHasMore ||
      chatNextOffset === null ||
      olderHistoryLoading ||
      loadingOlderRef.current
    ) {
      return;
    }

    loadingOlderRef.current = true;

    const previousScrollHeight =
      container.scrollHeight;

    try {

      await dispatch(fetchChatHistoryThunk({
        groupId,
        offset: chatNextOffset,
      })).unwrap();

      requestAnimationFrame(() => {

        const currentContainer =
          contentRef.current;

        if (currentContainer) {

          currentContainer.scrollTop =
            currentContainer.scrollHeight -
            previousScrollHeight;

        }

        loadingOlderRef.current = false;

      });

    } catch {

      loadingOlderRef.current = false;

    }

  };

  const handleSend = () => {

    const text = draft.trim();

    if (!text) return;

    sendMessage(text);

    setDraft("");

  };

  const handleDeleteGroup = async () => {

    if (!groupId) return;

    try {

      await dispatch(deleteGroupThunk(groupId)).unwrap();

      navigate("/dashboard");

    } catch {

      // The rejected thunk stores the API error in the groups state.

    }

  };

  const formatTime = (date: string) => {

    return new Date(date).toLocaleTimeString([], {

      hour: "2-digit",

      minute: "2-digit",

    });

  };

  return (

    <Layout className="chat-screen">

      {/* HEADER */}

      <Header className="chat-header">

        <div className="chat-left">

          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            className="back-btn"
            onClick={() => navigate("/dashboard")}
          />

          <Avatar
            size={50}
            className="chat-avatar"
            icon={<UserOutlined />}
          />

          <div className="chat-header-info">

            <Title
              level={4}
              className="chat-title"
            >
              {groupDetails?.name || "Group Chat"}
            </Title>

            <div className="chat-status">

              <Badge
                status={
                  isConnected
                    ? "success"
                    : "warning"
                }
              />

              <Text>

                {isConnected
                  ? "Connected"
                  : "Connecting..."}

              </Text>

            </div>

          </div>

        </div>

        {groupDetails && String(groupDetails.createdBy) === user?.id && (

          <Popconfirm
            title="Delete this group?"
            description="All group messages and memberships will be permanently deleted."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: deleteLoading }}
            onConfirm={handleDeleteGroup}
          >

            <Button
              danger
              type="primary"
              icon={<DeleteOutlined />}
              loading={deleteLoading}
            >
              Delete group
            </Button>

          </Popconfirm>

        )}

      </Header>

      {(socketError || error || groupError) && (

        <Alert
          type="error"
          message={socketError || error || groupError}
          showIcon
          closable
          className="chat-alert"
          onClose={() =>
            setSocketError("")
          }
        />

      )}

      <Content
        ref={contentRef}
        className="chat-content"
        onScroll={handleHistoryScroll}
      >
        {olderHistoryLoading && (

          <div className="history-page-loader">

            <Spin size="small" />

          </div>

        )}

        {historyLoading ? (

          <div className="chat-loader">

            <Spin size="large" />

          </div>

        ) : chatHistory.length === 0 ? (

          <div className="empty-chat">

            <Avatar
              size={80}
              className="empty-avatar"
              icon={<UserOutlined />}
            />

            <Title level={4}>
              No Messages Yet
            </Title>

            <Text>
              Be the first one to start the conversation.
            </Text>

          </div>

        ) : (

          chatHistory.map((m) => {

            const isMine =
              m.senderId === user?.id;

            return (

              <div
                key={m._id}
                className={`message-row ${isMine ? "mine" : "theirs"
                  }`}
              >

                {!isMine && (
                  <Avatar
                    className="message-avatar"
                    icon={<UserOutlined />}
                  />
                )}

                <div className="message-bubble">

                  <div className="message-header">

                    <span className="message-sender">

                      {isMine
                        ? "You"
                        : m.senderName}

                    </span>

                    <span className="message-time">

                      {formatTime(
                        m.createdOn
                      )}

                    </span>

                  </div>

                  <div className="message-text">

                    {m.message}

                  </div>

                </div>

              </div>

            );

          })

        )}

        <div ref={messagesEndRef} />

      </Content>

      {/* FOOTER */}

      <Footer className="chat-footer">

        <Input
          value={draft}
          onChange={(e) =>
            setDraft(e.target.value)
          }
          onPressEnter={handleSend}
          placeholder="Type your message..."
          className="chat-input"
          disabled={!isConnected}
        />

        <Button
          type="primary"
          icon={<SendOutlined />}
          className="send-btn"
          disabled={
            !draft.trim() ||
            !isConnected
          }
          onClick={handleSend}
        >
          Send
        </Button>

      </Footer>

    </Layout>

  );

}

