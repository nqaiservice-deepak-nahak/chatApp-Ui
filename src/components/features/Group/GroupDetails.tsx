import { ArrowLeftOutlined, GlobalOutlined, LockOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Descriptions, Empty, Layout, Spin, Tag, Typography } from 'antd';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../../layout/AppHeader';
import { clearGroupDetails, clearGroupsError, fetchGroupDetailsThunk, joinGroupThunk } from '../../../redux/features/groups/groups.slice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { parseApiDate } from '../../../shared/shared-functions';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

export default function GroupDetails() {
  const { groupId } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { groupDetails, detailsLoading, joinLoading, error } = useAppSelector((state) => state.groups);

  useEffect(() => {
    if (groupId) dispatch(fetchGroupDetailsThunk(groupId));
    return () => {
      dispatch(clearGroupDetails());
    };
  }, [dispatch, groupId]);

  const handleJoin = async () => {
    if (!groupId) return;
    const result = await dispatch(joinGroupThunk(groupId));
    if (joinGroupThunk.fulfilled.match(result)) {
      navigate(`/chat/${groupId}`);
    }
  };

  return (
    <Layout className="app-layout">
      <AppHeader />
      <Content className="page-center">
        <Card className="group-details-card">
          <Button type="link" icon={<ArrowLeftOutlined />} className="link-button" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>

          {error && <Alert type="error" message={error} showIcon closable className="form-alert" onClose={() => dispatch(clearGroupsError())} />}

          {detailsLoading ? (
            <Spin />
          ) : !groupDetails ? (
            <Empty description="Group details are unavailable." />
          ) : (
            <>
              <Title level={3}>
                {groupDetails.name}{' '}
                <Tag
                  color={groupDetails.type === 'private' ? 'purple' : 'green'}
                  icon={groupDetails.type === 'private' ? <LockOutlined /> : <GlobalOutlined />}
                >
                  {groupDetails.type === 'private' ? 'Private' : 'Public'}
                </Tag>
              </Title>
              {groupDetails.description && <Paragraph type="secondary">{groupDetails.description}</Paragraph>}

              <Descriptions column={1} bordered size="small" className="details-list">
                <Descriptions.Item label="Created By">{groupDetails.createdByName}</Descriptions.Item>
                <Descriptions.Item label="Visibility">
                  {groupDetails.type === 'private' ? 'Invite only' : 'Discoverable by everyone'}
                </Descriptions.Item>
                <Descriptions.Item label="Created Date">
                  {parseApiDate(groupDetails.createdOn).toLocaleString()}
                </Descriptions.Item>
                {typeof groupDetails.totalMembers === 'number' && (
                  <Descriptions.Item label="Total Members">{groupDetails.totalMembers}</Descriptions.Item>
                )}
              </Descriptions>

              {groupDetails.isMember ? (
                <Button type="primary" size="large" block onClick={() => navigate(`/chat/${groupId}`)}>
                  Go to Chat
                </Button>
              ) : (
                <Button type="primary" size="large" block loading={joinLoading} onClick={handleJoin}>
                  Join Conversation
                </Button>
              )}
            </>
          )}
        </Card>
      </Content>
    </Layout>
  );
}
