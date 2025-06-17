import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Menu, 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Typography, 
  Space, 
  Tag,
  Popconfirm,
  message,
  Statistic,
  Row,
  Col,
  Select,
  Tabs
} from 'antd';
import { 
  UserOutlined, 
  BookOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  TrophyOutlined,
  BarChartOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { User, Topic, Vocabulaire, VocabulaireQuestion } from '../types';
import { usersAPI, topicsAPI, vocabulairesAPI, vocabulaireQuestionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [vocabulaires, setVocabulaires] = useState<Vocabulaire[]>([]);
  const [vocabularyQuestions, setVocabularyQuestions] = useState<VocabulaireQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user?.role !== 'admin') {
      message.error('Bạn không có quyền truy cập trang này');
      return;
    }
    fetchData();
  }, [user, selectedMenu]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (selectedMenu) {
        case 'users':
          const usersData = await usersAPI.getAll();
          setUsers(usersData);
          break;
        case 'topics':
          const topicsData = await topicsAPI.getAll();
          setTopics(topicsData);
          break;
        case 'vocabulary':
          const vocabulairesData = await vocabulairesAPI.getAll();
          setVocabulaires(vocabulairesData);
          const vocabularyQuestionsData = await vocabulaireQuestionsAPI.getAll();
          setVocabularyQuestions(vocabularyQuestionsData);
          break;
      }
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      switch (selectedMenu) {
        case 'users':
          await usersAPI.delete(id);
          message.success('Xóa người dùng thành công');
          break;
        case 'topics':
          await topicsAPI.delete(id);
          message.success('Xóa chủ đề thành công');
          break;
        case 'vocabulary':
          await vocabulaireQuestionsAPI.delete(id);
          message.success('Xóa từ vựng thành công');
          break;
      }
      fetchData();
    } catch (error) {
      message.error('Lỗi khi xóa');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingItem) {
        switch (selectedMenu) {
          case 'users':
            await usersAPI.update(editingItem.id, values);
            message.success('Cập nhật người dùng thành công');
            break;
          case 'topics':
            await topicsAPI.update(editingItem.id, values);
            message.success('Cập nhật chủ đề thành công');
            break;
          case 'vocabulary':
            await vocabulaireQuestionsAPI.update(editingItem.id, values);
            message.success('Cập nhật từ vựng thành công');
            break;
        }
      } else {
        switch (selectedMenu) {
          case 'users':
            await usersAPI.create(values);
            message.success('Thêm người dùng thành công');
            break;
          case 'topics':
            await topicsAPI.create(values);
            message.success('Thêm chủ đề thành công');
            break;
          case 'vocabulary':
            // Tạo vocabulaire trước, sau đó tạo vocabulaire question
            const vocabulaire = await vocabulairesAPI.create({
              topicId: values.topicId
            });
            await vocabulaireQuestionsAPI.create({
              ...values,
              vocabulaireId: vocabulaire.id
            });
            message.success('Thêm từ vựng thành công');
            break;
        }
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('Lỗi khi lưu dữ liệu');
    }
  };

  const getMenuItems = () => [
    {
      key: 'dashboard',
      icon: <BarChartOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: 'Quản lý người dùng',
    },
    {
      key: 'topics',
      icon: <BookOutlined />,
      label: 'Quản lý chủ đề',
    },
    {
      key: 'vocabulary',
      icon: <FileTextOutlined />,
      label: 'Quản lý từ vựng',
    },
  ];

  const getColumns = () => {
    const baseColumns = [
      {
        title: 'Hành động',
        key: 'action',
        render: (_: any, record: any) => (
          <Space size="middle">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa?"
              onConfirm={() => handleDelete(record.id)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];

    switch (selectedMenu) {
      case 'users':
        return [
          { title: 'ID', dataIndex: 'id', key: 'id' },
          { title: 'Email', dataIndex: 'email', key: 'email' },
          { 
            title: 'Vai trò', 
            dataIndex: 'role', 
            key: 'role',
            render: (role: string) => (
              <Tag color={role === 'admin' ? 'red' : 'blue'}>
                {role === 'admin' ? 'Admin' : 'User'}
              </Tag>
            ),
          },
          ...baseColumns,
        ];
      case 'topics':
        return [
          { title: 'ID', dataIndex: 'id', key: 'id' },
          { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
          { title: 'Mô tả', dataIndex: 'description', key: 'description' },
          ...baseColumns,
        ];
      case 'vocabulary':
        return [
          { title: 'ID', dataIndex: 'id', key: 'id' },
          { title: 'Tiếng Việt', dataIndex: 'title_vi', key: 'title_vi' },
          { title: 'Tiếng Anh', dataIndex: 'title_en', key: 'title_en' },
          { title: 'Mô tả VN', dataIndex: 'description_vi', key: 'description_vi' },
          { title: 'Mô tả EN', dataIndex: 'description_en', key: 'description_en' },
          { 
            title: 'Chủ đề', 
            key: 'topic',
            render: (_: any, record: VocabulaireQuestion) => {
              const vocabulaire = vocabulaires.find(v => v.id === record.vocabulaireId);
              const topic = topics.find(t => t.id === vocabulaire?.topicId);
              return topic?.title || 'N/A';
            }
          },
          ...baseColumns,
        ];
      default:
        return [];
    }
  };

  const getFormFields = () => {
    switch (selectedMenu) {
      case 'users':
        return [
          { name: 'email', label: 'Email', rules: [{ required: true, type: 'email' as const }] },
          { name: 'password', label: 'Mật khẩu', rules: [{ required: true, min: 6 }] },
          { name: 'role', label: 'Vai trò', rules: [{ required: true }] },
        ];
      case 'topics':
        return [
          { name: 'title', label: 'Tiêu đề', rules: [{ required: true }] },
          { name: 'description', label: 'Mô tả' },
        ];
      case 'vocabulary':
        return [
          { name: 'topicId', label: 'Chủ đề', rules: [{ required: true, type: 'number' as const }] },
          { name: 'title_vi', label: 'Tiếng Việt' },
          { name: 'title_en', label: 'Tiếng Anh' },
          { name: 'description_vi', label: 'Mô tả VN' },
          { name: 'description_en', label: 'Mô tả EN' },
          { name: 'audio_vi', label: 'Audio VN' },
          { name: 'audio_en', label: 'Audio EN' },
          { name: 'image', label: 'Hình ảnh' },
        ];
      default:
        return [];
    }
  };

  const getData = () => {
    switch (selectedMenu) {
      case 'users':
        return users;
      case 'topics':
        return topics;
      case 'vocabulary':
        return vocabularyQuestions;
      default:
        return [];
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <Title level={3} className="text-center text-red-600">
            Không có quyền truy cập
          </Title>
          <Text className="text-center block">
            Bạn cần quyền admin để truy cập trang này
          </Text>
        </Card>
      </div>
    );
  }

  return (
    <Layout className="min-h-screen">
      <Sider width={250} className="bg-white shadow-sm">
        <div className="p-4">
          <Title level={4} className="text-primary-600">Admin Panel</Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedMenu]}
          items={getMenuItems()}
          onClick={({ key }) => setSelectedMenu(key)}
          className="border-r-0"
        />
      </Sider>
      
      <Layout>
        <Content className="p-6 bg-gray-50">
          {selectedMenu === 'dashboard' ? (
            <div>
              <Title level={2} className="mb-6">Dashboard</Title>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Tổng người dùng"
                      value={users.length}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Tổng chủ đề"
                      value={topics.length}
                      prefix={<BookOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Tổng từ vựng"
                      value={vocabularyQuestions.length}
                      prefix={<FileTextOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Admin"
                      value={users.filter(u => u.role === 'admin').length}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <Title level={2}>
                  {selectedMenu === 'users' && 'Quản lý người dùng'}
                  {selectedMenu === 'topics' && 'Quản lý chủ đề'}
                  {selectedMenu === 'vocabulary' && 'Quản lý từ vựng'}
                </Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  Thêm mới
                </Button>
              </div>
              
              <Card>
                <Table
                  columns={getColumns()}
                  dataSource={getData() as any}
                  loading={loading}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                  }}
                />
              </Card>
            </div>
          )}
        </Content>
      </Layout>

      <Modal
        title={editingItem ? 'Chỉnh sửa' : 'Thêm mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {getFormFields().map((field) => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              rules={field.rules}
            >
              {field.name === 'role' ? (
                <Select placeholder="Chọn vai trò">
                  <Option value="user">User</Option>
                  <Option value="admin">Admin</Option>
                </Select>
              ) : field.name === 'topicId' ? (
                <Select placeholder="Chọn chủ đề">
                  {topics.map(topic => (
                    <Option key={topic.id} value={topic.id}>{topic.title}</Option>
                  ))}
                </Select>
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}
          
          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                {editingItem ? 'Cập nhật' : 'Thêm'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Admin; 