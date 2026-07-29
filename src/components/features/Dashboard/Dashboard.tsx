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
} from "@ant-design/icons";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../layout/AppHeader";

import {
  clearGroupsError,
  createGroupThunk,
  fetchAvailableGroupsThunk,
  fetchMyGroupsThunk,
} from "../../../redux/features/groups/groups.slice";

import { useAppDispatch, useAppSelector } from "../../../redux/hooks";

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

  useEffect(() => {
    dispatch(fetchMyGroupsThunk());
    dispatch(fetchAvailableGroupsThunk());
  }, [dispatch]);

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
              Welcome Back 👋
            </Title>

            <Text>
              Create groups, join communities and start chatting with your
              friends in a beautiful workspace.
            </Text>

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
              ) : myGroups.length === 0 ? (
                <Empty description="No joined groups yet." />
              ) : (
                <List
                  dataSource={myGroups}
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
              ) : availableGroups.length === 0 ? (
                <Empty description="No available groups." />
              ) : (
                <List
                  dataSource={availableGroups}
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