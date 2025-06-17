import React from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, BookOutlined, TrophyOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      label: 'Trang chủ',
      icon: <BookOutlined />,
    },
    {
      key: '/topics',
      label: 'Chủ đề học',
      icon: <BookOutlined />,
    },
    {
      key: '/vocabulary',
      label: 'Từ vựng',
      icon: <BookOutlined />,
    },
    {
      key: '/exams',
      label: 'Bài thi',
      icon: <TrophyOutlined />,
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Hồ sơ',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    ...(user?.role === 'admin' ? [
      {
        key: 'admin',
        label: 'Quản trị',
        icon: <UserOutlined />,
        onClick: () => navigate('/admin'),
      },
      {
        key: 'admin-vocabulary',
        label: 'Quản lý từ vựng',
        icon: <BookOutlined />,
        onClick: () => navigate('/admin/vocabulary'),
      },
      {
        key: 'admin-exams',
        label: 'Quản lý bài thi',
        icon: <TrophyOutlined />,
        onClick: () => navigate('/admin/exams'),
      },
    ] : []),
    {
      key: 'settings',
      label: 'Cài đặt',
      icon: <SettingOutlined />,
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      onClick: logout,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <AntHeader className="bg-white shadow-sm border-b border-gray-200 px-6">
      <div className="flex items-center justify-between h-full">
        {/* Logo */}
        <div className="flex items-center">
          <h1 
            className="text-2xl font-bold text-primary-600 cursor-pointer"
            onClick={() => navigate('/')}
          >
            Quiz App
          </h1>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 flex justify-center">
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            className="border-none bg-transparent"
          />
        </div>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          {user ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space className="cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <Avatar 
                  icon={<UserOutlined />} 
                  className="bg-primary-500"
                />
                <span className="text-gray-700 font-medium">
                  {user.email}
                </span>
              </Space>
            </Dropdown>
          ) : (
            <div className="flex items-center space-x-2">
              <Button 
                type="text" 
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-primary-600"
              >
                Đăng nhập
              </Button>
              <Button 
                type="primary" 
                onClick={() => navigate('/register')}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Đăng ký
              </Button>
            </div>
          )}
        </div>
      </div>
    </AntHeader>
  );
};

export default Header; 