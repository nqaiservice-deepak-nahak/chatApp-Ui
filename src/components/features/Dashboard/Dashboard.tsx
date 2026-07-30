import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Layout,
  List,
  Row,
  Spin,
  Typography,
} from "antd";
import {
  MessageOutlined,
  TeamOutlined,
  PlusCircleOutlined,
  UserOutlined,
  ArrowRightOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../layout/AppHeader";

import {
  clearGroupsError,
  createGroupThunk,
  fetchAvailableGroupsThunk,
  fetchMyGroupsThunk,
} from "../../../redux/features/groups/groups.slice";

import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { fetchAvailableUsersThunk } from "../../../redux/features/auth/auth.slice";

import "./dashboard.css";

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    myGroups,
    availableGroups,
    listLoading,
    createLoading,
    error,
  } = useAppSelector((state) => state.groups);

  const [form] = Form.useForm();
  const [groupSearch, setGroupSearch] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");
  const { user, availableUsers, usersLoading } = useAppSelector((state) => state.auth);
  const filteredMyGroups = useMemo(() => {
    const query = groupSearch.trim().toLowerCase();
    if (!query) return myGroups;
    return myGroups.filter(
      (group) =>
        group.name.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query)
    );
  }, [myGroups, groupSearch]);
  const filteredAvailableGroups = useMemo(() => {
    const query = groupSearch.trim().toLowerCase();
    if (!query) return availableGroups;
    return availableGroups.filter(
      (group) =>
        group.name.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query)
    );
  }, [availableGroups, groupSearch]);
  const filteredUsers = useMemo(() => {
    const query = peopleSearch.trim().toLowerCase();
    if (!query) return availableUsers;
    return availableUsers.filter(
      (person) => person.name.toLowerCase().includes(query) || person.email.toLowerCase().includes(query)
    );
  }, [availableUsers, peopleSearch]);

  useEffect(() => {
    dispatch(fetchMyGroupsThunk());
    dispatch(fetchAvailableGroupsThunk());
    dispatch(fetchAvailableUsersThunk());
  }, [dispatch]);

  const refreshDashboard = () => {
    dispatch(fetchMyGroupsThunk());
    dispatch(fetchAvailableGroupsThunk());
    dispatch(fetchAvailableUsersThunk());
  };

  const handleCreateGroup = async (values: {
    name: string;
    description?: string;
  }) => {
    const result = await dispatch(createGroupThunk(values));

    if (createGroupThunk.fulfilled.match(result)) {
      form.resetFields();
      dispatch(fetchAvailableGroupsThunk());
    }
  };

  return (
    <Layout className="dashboard-layout">
      <AppHeader />

      <Content className="dashboard-content">

        {/* HERO */}

        <div className="hero-section">

          <div>

            <Title level={2}>
              Welcome back, {user?.name || "there"}
            </Title>

            <Text>
              Continue a group conversation or connect privately with a teammate.
            </Text>

          </div>

          <div className="hero-actions">
            <Input
              allowClear
              value={groupSearch}
              onChange={(event) => setGroupSearch(event.target.value)}
              prefix={<SearchOutlined />}
              placeholder="Search conversations"
              aria-label="Search groups"
              className="group-search"
            />
            <Button
              icon={<ReloadOutlined spin={listLoading || usersLoading} />}
              onClick={refreshDashboard}
              disabled={listLoading || usersLoading}
              className="refresh-btn"
            >
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            closable
            className="dashboard-alert"
            onClose={() => dispatch(clearGroupsError())}
          />
        )}

        <Row gutter={[24, 24]}>
          <Col span={24}>
            <div className="dashboard-stats" aria-label="Workspace overview">
              <div className="stat-card"><strong>{myGroups.length}</strong><span>Joined groups</span></div>
              <div className="stat-card"><strong>{availableGroups.length}</strong><span>Groups to discover</span></div>
              <div className="stat-card"><strong>{availableUsers.length}</strong><span>People available</span></div>
            </div>
          </Col>

          {/* MY CHATS */}

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

              {listLoading ? (
                <div className="loader-box">
                  <Spin size="large" />
                </div>
              ) : filteredMyGroups.length === 0 ? (
                <Empty description={groupSearch ? "No joined groups match your search." : "No joined groups yet."} />
              ) : (
                <List
                  dataSource={filteredMyGroups}
                  renderItem={(group) => (
                    <List.Item
                      className="group-item"
                      onClick={() => navigate(`/chat/${group._id}`)}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className="avatar avatar-blue">
                            <UserOutlined />
                          </div>
                        }
                        title={group.name}
                        description={group.description}
                      />

                      <ArrowRightOutlined className="arrow" />

                    </List.Item>
                  )}
                />
              )}

            </Card>

          </Col>

          {/* AVAILABLE GROUPS */}

          <Col xs={24} xl={12}>

            <Card
              className="glass-card"
              title={
                <div className="card-title green">

                  <div className="title-icon">
                    <TeamOutlined />
                  </div>

                  <span>Available Groups</span>

                </div>
              }
            >

              {listLoading ? (
                <div className="loader-box">
                  <Spin size="large" />
                </div>
              ) : filteredAvailableGroups.length === 0 ? (
                <Empty description={groupSearch ? "No available groups match your search." : "No available groups."} />
              ) : (
                <List
                  dataSource={filteredAvailableGroups}
                  renderItem={(group) => (
                    <List.Item
                      className="group-item"
                      onClick={() => navigate(`/groups/${group._id}`)}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className="avatar avatar-green">
                            <TeamOutlined />
                          </div>
                        }
                        title={group.name}
                        description={
                          <>
                            <div>{group.description}</div>

                            <Text type="secondary" style={{color:'white'}}>
                              Created by {group.createdByName}
                            </Text>
                          </>
                        }
                      />

                      <ArrowRightOutlined className="arrow" />

                    </List.Item>
                  )}
                />
              )}

            </Card>

          </Col>

          {/* DIRECT MESSAGES */}

          <Col span={24}>
            <Card
              className="glass-card people-card"
              title={
                <div className="card-title cyan">
                  <div className="title-icon"><UserOutlined /></div>
                  <span>Direct Messages</span>
                </div>
              }
              extra={
                <Input
                  allowClear
                  value={peopleSearch}
                  onChange={(event) => setPeopleSearch(event.target.value)}
                  prefix={<SearchOutlined />}
                  placeholder="Search people"
                  className="people-search"
                  aria-label="Search people"
                />
              }
            >
              {usersLoading ? (
                <div className="loader-box"><Spin size="large" /></div>
              ) : filteredUsers.length === 0 ? (
                <Empty description={peopleSearch ? "No people match your search." : "No other users are available yet."} />
              ) : (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, lg: 3 }}
                  dataSource={filteredUsers}
                  renderItem={(person) => (
                    <List.Item>
                      <button className="person-card" onClick={() => navigate(`/messages/${person.id}`)}>
                        <div className="avatar avatar-cyan"><UserOutlined /></div>
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

          {/* CREATE GROUP */}

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

                  <Form
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                    onFinish={handleCreateGroup}
                  >

                    <Form.Item
                      label="Group Name"
                      name="name"
                      rules={[
                        {
                          required: true,
                          message: "Please enter group name",
                        },
                      ]}
                    >

                      <Input
                        size="large"
                        placeholder="Enter group name"
                      />

                    </Form.Item>

                    <Form.Item
                      label="Description"
                      name="description"
                    >

                      <TextArea
                        rows={5}
                        placeholder="Write something about your group..."
                      />

                    </Form.Item>

                    <Button
                      htmlType="submit"
                      loading={createLoading}
                      className="create-btn"
                    >
                      Create Group
                    </Button>

                  </Form>

                </Col>

                <Col
                  xs={24}
                  lg={10}
                  className="create-info"
                >

                  <div className="info-box">

                    <PlusCircleOutlined className="info-icon" />

                    <Title level={4}>
                      Build Your Community
                    </Title>

                    <Text>
                      Create a new group and invite members to collaborate,
                      discuss ideas, share updates and communicate instantly
                      using real-time messaging.
                    </Text>

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
