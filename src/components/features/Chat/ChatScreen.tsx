import {
  ArrowLeftOutlined,
  DeleteOutlined,
  GlobalOutlined,
  LockOutlined,
  MoreOutlined,
  SendOutlined,
  SwapOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";

import {
  Alert,
  Avatar,
  Badge,
  Button,
  Dropdown,
  Input,
  Layout,
  Modal,
  Select,
  Spin,
  Tag,
  Typography,
} from "antd";

import { UIEvent, useEffect, useMemo, useRef, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  appendMessage,
  clearChatHistory,
  clearMessagesError,
  fetchChatsThunk,
  fetchChatHistoryThunk,
} from "../../../redux/features/messages/messages.slice";

import {
  addGroupMembersThunk,
  clearGroupDetails,
  clearGroupMemberErrors,
  clearGroupsError,
  clearTransferOwnershipError,
  deleteGroupThunk,
  fetchAvailableGroupMembersThunk,
  fetchGroupDetailsThunk,
  transferGroupOwnershipThunk,
} from "../../../redux/features/groups/groups.slice";

import {
  clearAuthError,
  fetchAvailableUsersThunk,
} from "../../../redux/features/auth/auth.slice";

import {
  useAppDispatch,
  useAppSelector,
} from "../../../redux/hooks";

import { useChatSocket } from "../../../socket/useChatSocket";

import { parseApiDate } from "../../../shared/shared-functions";

import "./chatScreen.css";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function ChatScreen() {

  const { groupId } = useParams();

  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const {
    user,
    availableUsers,
    usersLoading,
    error: authError,
  } = useAppSelector((state) => state.auth);

  const {
    chatHistory,
    historyLoading,
    olderHistoryLoading,
    chatHasMore,
    chatNextOffset,
    chatList,
    chatsLoading,
    error,
  } = useAppSelector((state) => state.messages);

  const {
    groupDetails,
    availableMembers,
    membersLoading,
    addMembersLoading,
    transferLoading,
    membersError,
    addMembersError,
    transferError,
    deleteLoading,
    error: groupError,
  } = useAppSelector((state) => state.groups);

  const [draft, setDraft] = useState("");

  const [socketError, setSocketError] = useState("");

  const [addMembersOpen, setAddMembersOpen] = useState(false);

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const [memberFeedback, setMemberFeedback] = useState("");

  const [transferOpen, setTransferOpen] = useState(false);

  const [newOwnerUserId, setNewOwnerUserId] = useState<string>();

  const ownershipCandidates = useMemo(() => {
    const candidates = new Map<string, { id: string; name: string; email: string }>();

    availableUsers.forEach((candidate) => {
      if (candidate.id !== user?.id) candidates.set(candidate.id, candidate);
    });

    chatList.forEach((chat) => {
      if (chat.chatType !== "private" || !chat.directDetails) return;
      const candidate = {
        id: chat.directDetails.otherUserId,
        name: chat.directDetails.otherUserName,
        email: chat.directDetails.otherUserEmail,
      };
      if (candidate.id !== user?.id) candidates.set(candidate.id, candidate);
    });

    return Array.from(candidates.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [availableUsers, chatList, user?.id]);

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

    dispatch(clearGroupDetails());

    dispatch(fetchGroupDetailsThunk(groupId));

    dispatch(fetchChatHistoryThunk({ groupId }));

    return () => {

      dispatch(clearChatHistory());

      dispatch(clearGroupDetails());

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

  const openAddMembers = () => {

    if (!groupId) return;

    setSelectedMemberIds([]);

    setMemberFeedback("");

    setAddMembersOpen(true);

    dispatch(clearGroupMemberErrors());

    dispatch(fetchAvailableGroupMembersThunk(groupId));

  };

  const handleAddMembers = async () => {

    if (!groupId || selectedMemberIds.length === 0) return;

    try {

      const result = await dispatch(addGroupMembersThunk({
        groupId,
        memberIds: selectedMemberIds,
      })).unwrap();

      setSelectedMemberIds([]);

      const failedCount = result.results.filter((item) => !item.ok).length;

      if (failedCount > 0) {

        setMemberFeedback(
          `${result.added} added; ${failedCount} could not be added. The available list has been refreshed.`
        );

        dispatch(fetchAvailableGroupMembersThunk(groupId));

      } else {

        setAddMembersOpen(false);

        setMemberFeedback("");

      }

      dispatch(fetchGroupDetailsThunk(groupId));

    } catch {

      // The rejected thunk exposes the API message through the groups state.

    }

  };

  const openTransferOwnership = () => {

    setNewOwnerUserId(undefined);

    setTransferOpen(true);

    dispatch(clearTransferOwnershipError());

    if (availableUsers.length === 0) dispatch(fetchAvailableUsersThunk());

    if (chatList.length === 0) dispatch(fetchChatsThunk());

  };

  const handleTransferOwnership = async () => {

    if (!groupId || !newOwnerUserId) return;

    try {

      await dispatch(transferGroupOwnershipThunk({
        groupId,
        newOwnerUserId,
      })).unwrap();

      setTransferOpen(false);

      setNewOwnerUserId(undefined);

    } catch {

      // The backend verifies that the selected user is already a member.

    }

  };

  const handleDeleteGroup = async () => {

    if (!groupId) return;

    try {

      await dispatch(deleteGroupThunk(groupId)).unwrap();

      navigate("/dashboard");

    } catch (deleteError) {

      // The rejected thunk stores the API error in the groups state.

      throw deleteError;

    }

  };

  const formatTime = (date: string) => {

    return parseApiDate(date).toLocaleTimeString([], {

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

            <div className="chat-title-row">

              <Title
                level={4}
                className="chat-title"
              >
                {groupDetails?.name || "Group Chat"}
              </Title>

              {groupDetails && (
                <Tag
                  color={groupDetails.type === "private" ? "purple" : "green"}
                  icon={groupDetails.type === "private" ? <LockOutlined /> : <GlobalOutlined />}
                >
                  {groupDetails.type === "private" ? "Private" : "Public"}
                </Tag>
              )}

            </div>

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

          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: "add-members",
                  icon: <UserAddOutlined />,
                  label: "Add members",
                },
                {
                  key: "transfer",
                  icon: <SwapOutlined />,
                  label: "Transfer ownership",
                },
                {
                  type: "divider",
                },
                {
                  key: "delete",
                  danger: true,
                  icon: <DeleteOutlined />,
                  label: "Delete group",
                },
              ],
              onClick: ({ key }) => {

                if (key === "add-members") {

                  openAddMembers();

                  return;

                }

                if (key === "transfer") {

                  openTransferOwnership();

                  return;

                }

                if (key !== "delete") return;

                Modal.confirm({
                  title: "Delete this group?",
                  content: "All group messages and memberships will be permanently deleted.",
                  okText: "Delete",
                  cancelText: "Cancel",
                  okButtonProps: { danger: true },
                  onOk: handleDeleteGroup,
                });

              },
            }}
          >

            <Button
              type="text"
              aria-label="Group options"
              icon={<MoreOutlined />}
              loading={deleteLoading || addMembersLoading || transferLoading}
            />

          </Dropdown>

        )}

      </Header>

      {(socketError || error || authError || groupError || membersError || addMembersError || transferError) && (

        <Alert
          type="error"
          message={socketError || error || authError || groupError || membersError || addMembersError || transferError}
          showIcon
          closable
          className="chat-alert"
          onClose={() => {
            setSocketError("");
            dispatch(clearGroupsError());
            dispatch(clearMessagesError());
            dispatch(clearAuthError());
          }}
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
          maxLength={4000}
          showCount
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

      <Modal
        title="Add members"
        open={addMembersOpen}
        okText="Add selected"
        cancelText="Cancel"
        confirmLoading={addMembersLoading}
        okButtonProps={{ disabled: selectedMemberIds.length === 0 }}
        onOk={handleAddMembers}
        onCancel={() => {
          if (addMembersLoading) return;
          setAddMembersOpen(false);
          setSelectedMemberIds([]);
          setMemberFeedback("");
        }}
      >
        <div className="group-action-modal">
          {(membersError || addMembersError) && (
            <Alert type="error" message={membersError || addMembersError} showIcon />
          )}
          {memberFeedback && <Alert type="warning" message={memberFeedback} showIcon />}
          <Text type="secondary">
            Choose people who are not already members of this group.
          </Text>
          <Select
            mode="multiple"
            allowClear
            showSearch
            value={selectedMemberIds}
            loading={membersLoading}
            placeholder={membersLoading ? "Loading people..." : "Select people to add"}
            optionFilterProp="label"
            options={availableMembers.map((member) => ({
              value: member.id,
              label: `${member.name || member.email || "Unnamed user"}${member.email ? ` (${member.email})` : ""}`,
            }))}
            onChange={setSelectedMemberIds}
            notFoundContent={membersLoading ? <Spin size="small" /> : "No people are available to add."}
          />
        </div>
      </Modal>

      <Modal
        title="Transfer group ownership"
        open={transferOpen}
        okText="Transfer ownership"
        cancelText="Cancel"
        confirmLoading={transferLoading}
        okButtonProps={{ danger: true, disabled: !newOwnerUserId }}
        onOk={handleTransferOwnership}
        onCancel={() => {
          if (transferLoading) return;
          setTransferOpen(false);
          setNewOwnerUserId(undefined);
        }}
      >
        <div className="group-action-modal">
          {transferError && <Alert type="error" message={transferError} showIcon />}
          <Text type="secondary">
            Select an existing group member. After transfer, only the new owner can add members,
            transfer ownership, or delete this group.
          </Text>
          <Select
            allowClear
            showSearch
            value={newOwnerUserId}
            loading={usersLoading || chatsLoading}
            placeholder="Select the new owner"
            optionFilterProp="label"
            options={ownershipCandidates.map((candidate) => ({
              value: candidate.id,
              label: `${candidate.name} (${candidate.email})`,
            }))}
            onChange={setNewOwnerUserId}
            notFoundContent={usersLoading || chatsLoading ? <Spin size="small" /> : "No users found."}
          />
          <Text type="secondary" className="group-action-hint">
            The API will confirm that the selected person is already a member.
          </Text>
        </div>
      </Modal>

    </Layout>

  );

}

