import { ConfigProvider } from 'antd';
import AppRoutes from '../../routes';

/**
 * Root application shell, mirroring the reference project's
 * containers/App/index.tsx. Wraps the route table with the Ant Design
 * theme provider so the whole app shares consistent design tokens.
 */
const MyApp = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 8
        }
      }}
    >
      <AppRoutes />
    </ConfigProvider>
  );
};

export default MyApp;
