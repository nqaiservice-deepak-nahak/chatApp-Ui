// import { LogoutOutlined } from '@ant-design/icons';
// import { Button, Layout, Typography } from 'antd';
// import { useNavigate } from 'react-router-dom';
// import { logout } from '../../redux/features/auth/auth.slice';
// import { useAppDispatch, useAppSelector } from '../../redux/hooks';

// const { Header } = Layout;
// const { Title, Text } = Typography;

// export default function AppHeader() {
//   const dispatch = useAppDispatch();
//   const navigate = useNavigate();
//   const user = useAppSelector((state) => state.auth.user);

//   const handleLogout = () => {
//     dispatch(logout());
//     navigate('/login');
//   };

//   return (
//     <Header className="app-header">
//       <div>
//         <Title level={3} className="app-header-title">
//           Group Chat
//         </Title>
//         {user && <Text type="secondary">Signed in as {user.name}</Text>}
//       </div>
//       <Button icon={<LogoutOutlined />} onClick={handleLogout}>
//         Log Out
//       </Button>
//     </Header>
//   );
// }

import {
  LogoutOutlined,
  MessageOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Layout,
  Space,
  Typography,
} from "antd";
import { useNavigate } from "react-router-dom";

import { logout } from "../../redux/features/auth/auth.slice";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";

import "./appHeader.css";

const { Title, Text } = Typography;

export default function AppHeader() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="app-header">

      {/* LEFT */}

      <div className="header-left">

        <div className="logo-box">

          <MessageOutlined />

        </div>

        <div>

          <Title
            level={4}
            className="app-title"
          >
            Chatter
          </Title>

          <Text className="app-subtitle">
            Real-Time Messaging
          </Text>

        </div>

      </div>

      {/* RIGHT */}

      <div className="header-right">
        {user && (
          <div className="profile-box">

            <Avatar
              size={46}
              className="profile-avatar"
              icon={<UserOutlined />}
            />

            <div>

              <Text className="welcome-text">
                Welcome
              </Text>

              <div className="username">
                {user.name}
              </div>

            </div>

          </div>
        )}

        <Button
          danger
          icon={<LogoutOutlined />}
          className="logout-btn"
          aria-label="Log out"
          title="Log out"
          onClick={handleLogout}
        >
          Logout
        </Button>

      </div>

    </header>
  );
}
