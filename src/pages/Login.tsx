import React from 'react';
import { Form, Input, Button, Card, Typography, Divider } from 'antd';
import {  LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: LoginForm) => {
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (error) {
      // Error is handled in AuthContext
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Title level={2} className="text-gray-900">
            Đăng nhập
          </Title>
          <Text className="text-gray-600">
            Đăng nhập vào tài khoản của bạn
          </Text>
        </div>

        <Card className="shadow-lg">
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="Nhập email của bạn"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Nhập mật khẩu của bạn"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 rounded-lg h-12"
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <Divider>
            <Text className="text-gray-500">hoặc</Text>
          </Divider>

          <div className="text-center">
            <Text className="text-gray-600">
              Chưa có tài khoản?{' '}
              <Link 
                to="/register" 
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Đăng ký ngay
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login; 