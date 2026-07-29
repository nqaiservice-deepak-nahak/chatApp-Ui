import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, this page doesn't exist."
      extra={
        <Button type="primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      }
    />
  );
}
