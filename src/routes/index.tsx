import { Spin } from 'antd';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

const ChatScreen = lazy(() => import('../components/features/Chat/ChatScreen'));
const Dashboard = lazy(() => import('../components/features/Dashboard/Dashboard'));
const DirectChatScreen = lazy(() => import('../components/features/DirectChat/DirectChatScreen'));
const GroupDetails = lazy(() => import('../components/features/Group/GroupDetails'));
const Login = lazy(() => import('../components/features/Auth/Login'));
const Register = lazy(() => import('../components/features/Auth/Register'));
const NotFound = lazy(() => import('../components/errors/404'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<div className="route-loader"><Spin size="large" /></div>}>
      <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/groups/:groupId"
        element={
          <PrivateRoute>
            <GroupDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="/chat/:groupId"
        element={
          <PrivateRoute>
            <ChatScreen />
          </PrivateRoute>
        }
      />
      <Route
        path="/messages/:userId"
        element={
          <PrivateRoute>
            <DirectChatScreen />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
