import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Avatar, Divider, Row, Col, Statistic } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, TrophyOutlined, BookOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // TODO: Implement profile update
      console.log('Profile update:', values);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data - in real app, this would come from API
  const stats = {
    totalTopics: 8,
    completedTopics: 3,
    totalVocabulary: 150,
    learnedVocabulary: 45,
    totalExams: 12,
    passedExams: 8,
    currentStreak: 5,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Title level={2} className="mb-8">Hồ sơ cá nhân</Title>
        
        <Row gutter={[24, 24]}>
          {/* Profile Info */}
          <Col xs={24} lg={16}>
            <Card title="Thông tin cá nhân" className="mb-6">
              <div className="flex items-center mb-6">
                <Avatar 
                  size={80} 
                  icon={<UserOutlined />} 
                  className="bg-primary-500 mr-4"
                />
                <div>
                  <Title level={4} className="mb-1">{user?.email}</Title>
                  <Text className="text-gray-600">
                    {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                  </Text>
                </div>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                  email: user?.email,
                }}
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
                    prefix={<MailOutlined />} 
                    placeholder="Nhập email của bạn"
                    disabled
                  />
                </Form.Item>

                <Form.Item
                  name="newPassword"
                  label="Mật khẩu mới"
                  rules={[
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined />} 
                    placeholder="Nhập mật khẩu mới (để trống nếu không đổi)"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  dependencies={['newPassword']}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu không khớp!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined />} 
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    Cập nhật thông tin
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* Stats */}
          <Col xs={24} lg={8}>
            <Card title="Thống kê học tập" className="mb-6">
              <div className="space-y-4">
                <Statistic
                  title="Chủ đề đã học"
                  value={stats.completedTopics}
                  suffix={`/ ${stats.totalTopics}`}
                  prefix={<BookOutlined className="text-primary-600" />}
                />
                <Divider />
                <Statistic
                  title="Từ vựng đã học"
                  value={stats.learnedVocabulary}
                  suffix={`/ ${stats.totalVocabulary}`}
                  prefix={<BookOutlined className="text-green-600" />}
                />
                <Divider />
                <Statistic
                  title="Bài thi đã làm"
                  value={stats.passedExams}
                  suffix={`/ ${stats.totalExams}`}
                  prefix={<TrophyOutlined className="text-yellow-600" />}
                />
                <Divider />
                <Statistic
                  title="Ngày liên tiếp"
                  value={stats.currentStreak}
                  suffix="ngày"
                  prefix={<TrophyOutlined className="text-red-600" />}
                />
              </div>
            </Card>

            <Card title="Thành tích">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Text>Hoàn thành chủ đề đầu tiên</Text>
                  <Text className="text-green-600">✓</Text>
                </div>
                <div className="flex items-center justify-between">
                  <Text>Học 50 từ vựng</Text>
                  <Text className="text-green-600">✓</Text>
                </div>
                <div className="flex items-center justify-between">
                  <Text>Làm 5 bài thi</Text>
                  <Text className="text-green-600">✓</Text>
                </div>
                <div className="flex items-center justify-between">
                  <Text>Học liên tiếp 7 ngày</Text>
                  <Text className="text-gray-400">○</Text>
                </div>
                <div className="flex items-center justify-between">
                  <Text>Hoàn thành tất cả chủ đề</Text>
                  <Text className="text-gray-400">○</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Profile; 