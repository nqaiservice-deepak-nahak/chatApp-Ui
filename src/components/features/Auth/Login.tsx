import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthError, loginThunk } from '../../../redux/features/auth/auth.slice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import './auth.css'
const { Title, Text } = Typography;

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loginLoading, error } = useAppSelector((state) => state.auth);

  const handleFinish = async (values: { email: string; password: string }) => {
    const result = await dispatch(loginThunk(values));
    if (loginThunk.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <Title level={3}>Welcome back</Title>
        <Text type="secondary">Log in to continue chatting</Text>

        {error && <Alert type="error" message={error} showIcon className="form-alert" closable onClose={() => dispatch(clearAuthError())} />}

        <Form layout="vertical" onFinish={handleFinish} className="form-spacing" requiredMark={false}>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please enter your email.' }, { type: 'email', message: 'Please enter a valid email.' }]}>
            <Input placeholder="you@example.com" size="large" />
          </Form.Item>

          <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please enter your password.' }]}>
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loginLoading}>
              Log In
            </Button>
          </Form.Item>
        </Form>

        <div className="switch-link">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </div>
      </Card>
    </div>
  );
}
