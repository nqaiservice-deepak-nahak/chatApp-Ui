import { Alert, Button, Form, Input } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthError, loginThunk } from '../../../redux/features/auth/auth.slice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import AuthVisualPanel, { AuthBrandMark } from './AuthVisualPanel';
import './auth.css'

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const passwordValue = Form.useWatch('password', form);
  const { loginLoading, error } = useAppSelector((state) => state.auth);

  const handleFinish = async (values: { email: string; password: string }) => {
    const result = await dispatch(loginThunk(values));
    if (loginThunk.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-page">
      <AuthVisualPanel />

      <main className="auth-form-panel">
        <div className="auth-form-content">
          <AuthBrandMark />

          <div className="auth-heading">
            <h1>Login to your account</h1>
            <p>Welcome back. Your conversations are waiting for you.</p>
          </div>

          {error && <Alert type="error" message={error} showIcon className="form-alert" closable onClose={() => dispatch(clearAuthError())} />}

          <Form form={form} layout="vertical" onFinish={handleFinish} className="form-spacing" requiredMark={false}>
            <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please enter your email.' }, { type: 'email', message: 'Please enter a valid email.' }]}>
              <Input placeholder="mail@example.com" size="large" autoComplete="email" />
            </Form.Item>

            <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please enter your password.' }]}>
              <Input.Password
                placeholder="Enter your password"
                size="large"
                autoComplete="current-password"
                visibilityToggle={Boolean(passwordValue)}
                iconRender={(visible) =>
                  visible ? <EyeOutlined title="Hide password" /> : <EyeInvisibleOutlined title="Show password" />
                }
              />
            </Form.Item>

            <Form.Item className="auth-submit-item">
              <Button type="primary" htmlType="submit" block size="large" loading={loginLoading}>
                Login
              </Button>
            </Form.Item>
          </Form>

          <div className="switch-link">
            Not registered yet? <Link to="/register">Create an account</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
