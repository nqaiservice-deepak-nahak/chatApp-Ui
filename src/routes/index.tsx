import { Navigate, Route, Routes } from 'react-router-dom';
import ChatScreen from '../components/features/Chat/ChatScreen';
import Dashboard from '../components/features/Dashboard/Dashboard';
import GroupDetails from '../components/features/Group/GroupDetails';
import Login from '../components/features/Auth/Login';
import Register from '../components/features/Auth/Register';
import NotFound from '../components/errors/404';
import PrivateRoute from './PrivateRoute';

const AppRoutes = () => {
  return (
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
