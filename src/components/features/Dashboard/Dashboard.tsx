import {
  ArrowRightOutlined,
  GlobalOutlined,
  LockOutlined,
  MessageOutlined,
  PlusCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Layout,
  List,
  Row,
  Select,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ChatListItem, GroupType } from "../../../@types";
import {
  clearAuthError,
  fetchAvailableUsersThunk,
} from "../../../redux/features/auth/auth.slice";
import {
  clearGroupsError,
  createGroupThunk,
  fetchAvailableGroupsThunk,
  fetchMyGroupsThunk,
} from "../../../redux/features/groups/groups.slice";
import {
  clearMessagesError,
  fetchChatsThunk,
} from "../../../redux/features/messages/messages.slice";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { parseApiDate } from "../../../shared/shared-functions";
import { useChatListSocket } from "../../../socket/useChatListSocket";
import SearchBar from "../../common/SearchBar";
import AppHeader from "../../layout/AppHeader";
import "./dashboard.css";

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const DESCRIPTION_CHARACTER_LIMIT = 250;

interface CreateGroupValues {
  name: string;
  description?: string;
  type: GroupType;
  memberIds?: string[];
}

const formatChatTime = (value?: string | null): string => {
  if (!value) return "";

  const date = parseApiDate(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  return isToday
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { day: "2-digit", month: "short" });
};

const getChatRoute = (chat: ChatListItem): string => {
  if (chat.chatType === "private") {
    return `/messages/${chat.directDetails?.otherUserId || chat.id}`;
  }

  return `/chat/${chat.id}`;
};

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm<CreateGroupValues>();
  const [groupSearch, setGroupSearch] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");
  const [createWarning, setCreateWarning] = useState("");

  const {
    availableGroups,
    listLoading,
    availableLoading,
    createLoading,
    error,
    availableError,
    searchError,
  } = useAppSelector((state) => state.groups);
  const {
    chatList,
    chatTotalCount,
    chatsLoading,
    error: messagesError,
  } = useAppSelector((state) => state.messages);
  const {
    user,
    availableUsers,
    availableUsersTotalCount,
    usersLoading,
    error: authError,
  } = useAppSelector((state) => state.auth);

  const normalizedGroupSearch = groupSearch.trim();
  const normalizedPeopleSearch = peopleSearch.trim();

  const memberOptions = useMemo(() => {
    const candidates = new Map<string, { value: string; label: string }>();

    const addCandidate = (id: string | undefined, name: string | undefined, email?: string) => {
      if (!id || id === user?.id || candidates.has(id)) return;
      const displayName = name?.trim() || "Unknown user";
      candidates.set(id, {
        value: id,
        label: email ? `${displayName} — ${email}` : displayName,
      });
    };

    availableUsers.forEach((person) => addCandidate(person.id, person.name, person.email));
    chatList.forEach((chat) => {
      if (chat.chatType !== "private") return;
      const details = chat.directDetails;
      addCandidate(
        details?.otherUserId || chat.id,
        details?.otherUserName || chat.name,
        details?.otherUserEmail || chat.description || undefined,
      );
    });

    return Array.from(candidates.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [availableUsers, chatList, user?.id]);

  const unreadTotal = useMemo(
    () => chatList.reduce((total, chat) => total + (chat.unreadCount || 0), 0),
    [chatList],
  );

  const refreshChats = useCallback(() => {
    dispatch(fetchChatsThunk({
      offset: 0,
      limit: 100,
      searchData: normalizedGroupSearch || undefined,
    }));
  }, [dispatch, normalizedGroupSearch]);

  useChatListSocket(refreshChats);

  useEffect(() => {
    dispatch(fetchMyGroupsThunk({ offset: 0, limit: 100 }));
  }, [dispatch]);


  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refreshChats();
      dispatch(
        fetchAvailableGroupsThunk({
          offset: 0,
          limit: 100,
          searchData: normalizedGroupSearch || undefined,
        }),
      );
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, normalizedGroupSearch, refreshChats]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      dispatch(
        fetchAvailableUsersThunk({
          offset: 0,
          limit: 10,
          searchData: normalizedPeopleSearch || undefined,
        }),
      );
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, normalizedPeopleSearch]);

  const refreshDashboard = () => {
    refreshChats();
    dispatch(fetchMyGroupsThunk({ offset: 0, limit: 100 }));
    dispatch(fetchAvailableUsersThunk({
      offset: 0,
      limit: 10,
      searchData: normalizedPeopleSearch || undefined,
    }));
    dispatch(fetchAvailableGroupsThunk({
      offset: 0,
      limit: 100,
      searchData: normalizedGroupSearch || undefined,
    }));
  };

  const handleCreateGroup = async (values: CreateGroupValues) => {
    setCreateWarning("");

    const result = await dispatch(
      createGroupThunk({
        ...values,
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        memberIds: values.memberIds?.length ? values.memberIds : undefined,
      }),
    );

    if (createGroupThunk.fulfilled.match(result)) {
      const failedInvites = result.payload.memberAddSummary.filter((item) => !item.ok).length;
      if (failedInvites > 0) {
        setCreateWarning(
          `The group was created, but ${failedInvites} invitation${failedInvites === 1 ? "" : "s"} could not be added.`,
        );
      }

      form.resetFields();
      refreshChats();
      dispatch(fetchMyGroupsThunk({ offset: 0, limit: 100 }));
      dispatch(fetchAvailableGroupsThunk({
        offset: 0,
        limit: 100,
        searchData: normalizedGroupSearch || undefined,
      }));
    }
  };

  const refreshing =
    chatsLoading ||
    listLoading ||
    availableLoading ||
    usersLoading;
  const dashboardError = error || searchError || availableError || messagesError || authError;

  return (
    <Layout className="dashboard-layout">
      <AppHeader />

      <Content className="dashboard-content">
        <div className="hero-section">
          <div>
            <Title level={2}>Welcome back, {user?.name || "there"}</Title>
            <Text>
              Pick up a conversation, discover a public group, or start something new.
            </Text>
          </div>

          <div className="hero-actions">
            <SearchBar
              value={groupSearch}
              onChange={(event) => setGroupSearch(event.target.value)}
              loading={availableLoading || chatsLoading}
              placeholder="Search chats and public groups"
              aria-label="Search chats and public groups"
              className="group-search"
            />
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={refreshDashboard}
              disabled={refreshing}
              className="refresh-btn"
            >
              Refresh
            </Button>
          </div>
        </div>

        {dashboardError && (
          <Alert
            type="error"
            message={dashboardError}
            showIcon
            closable
            className="dashboard-alert"
            onClose={() => {
              dispatch(clearGroupsError());
              dispatch(clearMessagesError());
              dispatch(clearAuthError());
            }}
          />
        )}

        {createWarning && (
          <Alert
            type="warning"
            message={createWarning}
            showIcon
            closable
            className="dashboard-alert"
            onClose={() => setCreateWarning("")}
          />
        )}

        <Row gutter={[24, 24]}>
          <Col span={24}>
            <div className="dashboard-stats" aria-label="Workspace overview">
              <div className="stat-card">
                <strong>{chatTotalCount}</strong>
                <span>{normalizedGroupSearch ? "Chat matches" : "Active chats"}</span>
              </div>
              <div className="stat-card">
                <strong>{unreadTotal}</strong>
                <span>Unread messages</span>
              </div>
              <div className="stat-card">
                <strong>{availableUsersTotalCount}</strong>
                <span>New people</span>
              </div>
            </div>
          </Col>

          <Col xs={24} xl={12}>
            <Card
              className="glass-card"
              title={
                <div className="card-title blue">
                  <div className="title-icon">
                    <MessageOutlined />
                  </div>
                  <span>My Chats</span>
                </div>
              }
            >
              {chatsLoading ? (
                <div className="loader-box">
                  <Spin size="large" />
                </div>
              ) : chatList.length === 0 ? (
                <Empty
                  description={
                    normalizedGroupSearch
                      ? `No chats match “${normalizedGroupSearch}”.`
                      : "No conversations yet. Join a group or message someone below."
                  }
                />
              ) : (
                <List
                  dataSource={chatList}
                  renderItem={(chat) => {
                    const groupType = chat.groupDetails?.type || "public";
                    const lastMessageTime = formatChatTime(chat.lastMessageAt);

                    return (
                      <List.Item
                        className="group-item chat-list-item"
                        onClick={() => navigate(getChatRoute(chat))}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            navigate(getChatRoute(chat));
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <List.Item.Meta
                          avatar={
                            <Badge
                              count={chat.unreadCount}
                              overflowCount={99}
                              size="small"
                              offset={[-2, 3]}
                            >
                              <div
                                className={`avatar ${
                                  chat.chatType === "private" ? "avatar-cyan" : "avatar-blue"
                                }`}
                              >
                                {chat.chatType === "private" ? <UserOutlined /> : <TeamOutlined />}
                              </div>
                            </Badge>
                          }
                          title={
                            <div className="chat-title-row">
                              <span>{chat.name}</span>
                              <Tag
                                bordered={false}
                                className={`type-tag ${
                                  chat.chatType === "private" ? "type-direct" : `type-${groupType}`
                                }`}
                              >
                                {chat.chatType === "private" ? "Direct" : groupType}
                              </Tag>
                            </div>
                          }
                          description={
                            <div className="chat-description">
                              <span className={!chat.lastMessagePreview ? "empty-preview" : undefined}>
                                {chat.lastMessagePreview ||
                                  chat.description ||
                                  "No messages yet"}
                              </span>
                              {lastMessageTime && (
                                <time dateTime={chat.lastMessageAt || undefined}>
                                  {lastMessageTime}
                                </time>
                              )}
                            </div>
                          }
                        />
                        <ArrowRightOutlined className="arrow" />
                      </List.Item>
                    );
                  }}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} xl={12}>
            <Card
              className="glass-card"
              title={
                <div className="card-title green">
                  <div className="title-icon">
                    <TeamOutlined />
                  </div>
                  <span>Discover Public Groups</span>
                </div>
              }
            >
              {availableLoading ? (
                <div className="loader-box">
                  <Spin size="large" />
                </div>
              ) : availableGroups.length === 0 ? (
                <Empty
                  description={
                    normalizedGroupSearch
                      ? `No public groups match “${normalizedGroupSearch}”.`
                      : "No public groups are available right now."
                  }
                />
              ) : (
                <List
                  dataSource={availableGroups}
                  renderItem={(group) => (
                    <List.Item
                      className="group-item"
                      onClick={() => navigate(`/groups/${group._id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/groups/${group._id}`);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className="avatar avatar-green">
                            <GlobalOutlined />
                          </div>
                        }
                        title={
                          <div className="chat-title-row">
                            <span>{group.name}</span>
                            <Tag bordered={false} className="type-tag type-public">
                              public
                            </Tag>
                          </div>
                        }
                        description={
                          <div className="available-group-copy">
                            {group.description && <span>{group.description}</span>}
                            <small>Created by {group.createdByName}</small>
                          </div>
                        }
                      />
                      <ArrowRightOutlined className="arrow" />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          <Col span={24}>
            <Card
              className="glass-card people-card"
              title={
                <div className="card-title cyan">
                  <div className="title-icon">
                    <UserOutlined />
                  </div>
                  <span>Start a Direct Message</span>
                </div>
              }
              extra={
                <SearchBar
                  value={peopleSearch}
                  onChange={(event) => setPeopleSearch(event.target.value)}
                  loading={usersLoading}
                  placeholder="Search people"
                  className="people-search"
                  aria-label="Search people"
                />
              }
            >
              {usersLoading ? (
                <div className="loader-box">
                  <Spin size="large" />
                </div>
              ) : availableUsers.length === 0 ? (
                <Empty
                  description={
                    peopleSearch
                      ? "No new people match your search."
                      : "Everyone available is already in your chats."
                  }
                />
              ) : (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, lg: 3 }}
                  dataSource={availableUsers}
                  renderItem={(person) => (
                    <List.Item>
                      <button
                        className="person-card"
                        onClick={() => navigate(`/messages/${person.id}`)}
                      >
                        <div className="avatar avatar-cyan">
                          <UserOutlined />
                        </div>
                        <div className="person-copy">
                          <strong>{person.name}</strong>
                          <span>{person.email}</span>
                        </div>
                        <ArrowRightOutlined className="arrow" />
                      </button>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          <Col span={24}>
            <Card
              className="glass-card create-card"
              title={
                <div className="card-title purple">
                  <div className="title-icon">
                    <PlusCircleOutlined />
                  </div>
                  <span>Create New Group</span>
                </div>
              }
            >
              <Row gutter={30}>
                <Col xs={24} lg={14}>
                  <Form<CreateGroupValues>
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                    initialValues={{ type: "public", memberIds: [] }}
                    onFinish={handleCreateGroup}
                  >
                    <Form.Item
                      label="Group Name"
                      name="name"
                      rules={[
                        { required: true, whitespace: true, message: "Please enter a group name." },
                        { max: 150, message: "Group names can be up to 150 characters." },
                      ]}
                    >
                      <Input size="large" placeholder="Enter group name" maxLength={150} />
                    </Form.Item>

                    <Form.Item
                      className="group-description-field"
                      label="Description"
                      name="description"
                      rules={[
                        {
                          max: DESCRIPTION_CHARACTER_LIMIT,
                          message: "Descriptions can be up to 250 characters.",
                        },
                      ]}
                    >
                      <TextArea
                        className="group-description-input"
                        rows={5}
                        placeholder="What will this group be about?"
                        maxLength={DESCRIPTION_CHARACTER_LIMIT}
                        showCount
                      />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col xs={24} md={9}>
                        <Form.Item label="Visibility" name="type">
                          <Select
                            className="dashboard-select"
                            options={[
                              {
                                value: "public",
                                label: (
                                  <span className="select-option">
                                    <GlobalOutlined /> Public
                                  </span>
                                ),
                              },
                              {
                                value: "private",
                                label: (
                                  <span className="select-option">
                                    <LockOutlined /> Private
                                  </span>
                                ),
                              },
                            ]}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={15}>
                        <Form.Item
                          label="Add members"
                          name="memberIds"
                          tooltip="Optional. You can add up to 100 people now and add more later."
                        >
                          <Select
                            mode="multiple"
                            allowClear
                            className="dashboard-select member-select"
                            optionFilterProp="label"
                            options={memberOptions}
                            maxCount={100}
                            maxTagCount="responsive"
                            placeholder={
                              memberOptions.length
                                ? "Choose people to add"
                                : "No people available to add"
                            }
                            disabled={!memberOptions.length}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Button
                      htmlType="submit"
                      loading={createLoading}
                      className="create-btn"
                    >
                      Create Group
                    </Button>
                  </Form>
                </Col>

                <Col xs={24} lg={10} className="create-info">
                  <div className="info-box">
                    <PlusCircleOutlined className="info-icon" />
                    <Title level={4}>Bring the right people together</Title>
                    <Text>
                      Public groups can be discovered and joined by anyone. Private groups stay
                      out of discovery, so add the people who should have access when you
                      create one.
                    </Text>
                    <div className="visibility-hints">
                      <span>
                        <GlobalOutlined /> Public and discoverable
                      </span>
                      <span>
                        <LockOutlined /> Private 
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
