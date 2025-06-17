import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Topics from './pages/Topics';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import AdminExams from './pages/AdminExams';
import Quiz from './pages/Quiz';
import AdminVocabulary from './pages/AdminVocabulary';
import TopicFlashcard from './pages/TopicFlashcard';
import ExamDetail from './pages/ExamDetail';
import './App.css';

const { Content } = Layout;

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Main App Layout
const AppLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <Layout className="min-h-screen">
      {user && <Header />}
      <Content className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/topics" 
            element={
              <ProtectedRoute>
                <Topics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/topics/:topicId/flashcard" 
            element={
              <ProtectedRoute>
                <TopicFlashcard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/exams" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminExams />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/vocabulary" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminVocabulary />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/quiz" 
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/exams/:id" 
            element={
              <ProtectedRoute>
                <ExamDetail />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Content>
    </Layout>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 8,
        },
      }}
    >
      <AuthProvider>
        <Router>
          <AppLayout />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
