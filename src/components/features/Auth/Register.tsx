import { Alert, Button, Card, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthError, registerThunk } from '../../../redux/features/auth/auth.slice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import './auth.css'

const { Title, Text } = Typography;

export default function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { registerLoading, error } = useAppSelector((state) => state.auth);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

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
      <Card className="auth-card">
        <Title level={3}>Create your account</Title>
        <Text type="secondary">Join and start chatting in groups</Text>

        {error && <Alert type="error" message={error} showIcon className="form-alert" closable onClose={() => dispatch(clearAuthError())} />}

        <Form form={form} layout="vertical" onFinish={handleFinish} className="form-spacing" requiredMark={false}>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter your name.' }]}>
            <Input placeholder="Jane Doe" size="large" />
          </Form.Item>

          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please enter your email.' }, { type: 'email', message: 'Please enter a valid email.' }]}>
            <Input placeholder="you@example.com" size="large" />
          </Form.Item>

          <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please enter your password.' }, { min: 6, message: 'Password must be at least 6 characters.' }]}>
            <Input.Password placeholder="At least 6 characters" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={registerLoading}>
              Register
            </Button>
          </Form.Item>
        </Form>

        <div className="switch-link">
          Already have an account? <Link to="/login">Log In</Link>
        </div>
      </Card>
    </div>
  );
}
