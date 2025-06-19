import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="header-main">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <span role="img" aria-label="logo" style={{ fontSize: 32, marginRight: 8 }}>📝</span>
          <span className="header-title">Quizz App</span>
        </Link>
        <nav className="header-nav">
          <Link to="/topics">Chủ đề</Link>
          <Link to="/profile">Tài khoản</Link>
          {user?.role === 'admin' && (
            <>
              <Link to="/admin">Quản trị</Link>
            </>
          )}
          {
            !user && <>
              <Link to="/login">Đăng nhập</Link>
              <Link to="/register">Đăng ký</Link>
            </>
          }
        </nav>
      </div>
    </header>
  );
};

export default Header; 