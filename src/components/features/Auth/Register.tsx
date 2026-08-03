import { Alert, Button, Form, Input, message } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthError, registerThunk } from '../../../redux/features/auth/auth.slice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import AuthVisualPanel, { AuthBrandMark } from './AuthVisualPanel';
import './auth.css'

export default function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { registerLoading, error } = useAppSelector((state) => state.auth);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const passwordValue = Form.useWatch('password', form);

  const handleFinish = async (values: { name: string; email: string; password: string }) => {
    const result = await dispatch(registerThunk(values));
    if (registerThunk.fulfilled.match(result)) {
      messageApi.success('Registered successfully! Redirecting to login…');
      form.resetFields();
      setTimeout(() => navigate('/login'), 1200);
    }
  };

  return (
    <div className="auth-page">
      {contextHolder}
      <AuthVisualPanel />

      <main className="auth-form-panel">
        <div className="auth-form-content">
          <AuthBrandMark />

          <div className="auth-heading">
            <h1>Create your account</h1>
            <p>Join the community and start meaningful conversations.</p>
          </div>

          {error && <Alert type="error" message={error} showIcon className="form-alert" closable onClose={() => dispatch(clearAuthError())} />}

          <Form form={form} layout="vertical" onFinish={handleFinish} className="form-spacing" requiredMark={false}>
            <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter your name.' }]}>
              <Input placeholder="Your full name" size="large" autoComplete="name" />
            </Form.Item>

            <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please enter your email.' }, { type: 'email', message: 'Please enter a valid email.' }]}>
              <Input placeholder="mail@example.com" size="large" autoComplete="email" />
            </Form.Item>

            <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please enter your password.' }, { min: 6, message: 'Password must be at least 6 characters.' }]}>
              <Input.Password
                placeholder="At least 6 characters"
                size="large"
                autoComplete="new-password"
                visibilityToggle={Boolean(passwordValue)}
                iconRender={(visible) =>
                  visible ? <EyeOutlined title="Hide password" /> : <EyeInvisibleOutlined title="Show password" />
                }
              />
            </Form.Item>

            <Form.Item className="auth-submit-item">
              <Button type="primary" htmlType="submit" block size="large" loading={registerLoading}>
                Create account
              </Button>
            </Form.Item>
          </Form>

          <div className="switch-link">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
