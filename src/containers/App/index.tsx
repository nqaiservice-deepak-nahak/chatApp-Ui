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
          colorPrimary: '#98006d',
          colorInfo: '#98006d',
          colorLink: '#98006d',
          colorText: '#403940',
          colorTextSecondary: '#81767d',
          colorBorder: '#eadde3',
          colorBgLayout: '#fff5df',
          borderRadius: 12,
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }
      }}
    >
      <AppRoutes />
    </ConfigProvider>
  );
};

export default MyApp;
