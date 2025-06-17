import React, { useState, useEffect } from 'react';
import {
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
  Collapse,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { topicsAPI, vocabulairesAPI, vocabulaireQuestionsAPI } from '../services/api';
import type { Topic, Vocabulaire, VocabulaireQuestion } from '../types';

const { Title } = Typography;
const { Panel } = Collapse;

const AdminVocabulary: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [vocabulaires, setVocabulaires] = useState<Vocabulaire[]>([]);
  const [vocabularyQuestions, setVocabularyQuestions] = useState<VocabulaireQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentTopicId, setCurrentTopicId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [topicsData, vocabulairesData, vocabularyQuestionsData] = await Promise.all([
        topicsAPI.getAll(),
        vocabulairesAPI.getAll(),
        vocabulaireQuestionsAPI.getAll()
      ]);
      setTopics(topicsData);
      setVocabulaires(vocabulairesData);
      setVocabularyQuestions(vocabularyQuestionsData);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (topicId: number) => {
    setEditingItem(null);
    setCurrentTopicId(topicId);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: VocabulaireQuestion, topicId: number) => {
    setEditingItem(record);
    setCurrentTopicId(topicId);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await vocabulaireQuestionsAPI.delete(id);
      message.success('Xóa từ vựng thành công');
      fetchData();
    } catch (error) {
      message.error('Lỗi khi xóa từ vựng');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingItem) {
        await vocabulaireQuestionsAPI.update(editingItem.id, values);
        message.success('Cập nhật từ vựng thành công');
      } else {
        // Tìm vocabulaire theo topicId, nếu chưa có thì tạo mới
        let vocabulaire = vocabulaires.find(v => v.topicId === currentTopicId);
        if (!vocabulaire) {
          vocabulaire = await vocabulairesAPI.create({ topicId: currentTopicId });
        }
        await vocabulaireQuestionsAPI.create({
          ...values,
          vocabulaireId: vocabulaire.id
        });
        message.success('Thêm từ vựng thành công');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('Lỗi khi lưu dữ liệu');
    }
  };

  // Lấy danh sách từ vựng theo topicId
  const getVocabularyByTopic = (topicId: number) => {
    const topicVocabulaires = vocabulaires.filter(v => v.topicId === topicId);
    const vocabulaireIds = topicVocabulaires.map(v => v.id);
    return vocabularyQuestions.filter(vq => vocabulaireIds.includes(vq.vocabulaireId));
  };

  const columns = (topicId: number) => [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Tiếng Việt',
      dataIndex: 'title_vi',
      key: 'title_vi',
      render: (text: string) => text || '-',
    },
    {
      title: 'Tiếng Anh',
      dataIndex: 'title_en',
      key: 'title_en',
      render: (text: string) => text || '-',
    },
    {
      title: 'Mô tả VN',
      dataIndex: 'description_vi',
      key: 'description_vi',
      render: (text: string) => text || '-',
      ellipsis: true,
    },
    {
      title: 'Mô tả EN',
      dataIndex: 'description_en',
      key: 'description_en',
      render: (text: string) => text || '-',
      ellipsis: true,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_: any, record: VocabulaireQuestion) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, topicId)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa từ vựng này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="mb-6">
        <Title level={2}>Quản lý từ vựng theo chủ đề</Title>
        <Collapse accordion>
          {topics.map(topic => (
            <Panel
              header={
                <span>
                  <FileTextOutlined className="mr-2" />
                  {topic.title}
                </span>
              }
              key={topic.id}
              extra={
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={e => {
                    e.stopPropagation();
                    handleAdd(topic.id);
                  }}
                >
                  Thêm mới
                </Button>
              }
            >
              <Table
                columns={columns(topic.id)}
                dataSource={getVocabularyByTopic(topic.id)}
                loading={loading}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} từ vựng`,
                }}
              />
            </Panel>
          ))}
        </Collapse>
      </Card>

      <Modal
        title={editingItem ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title_vi"
            label="Tiếng Việt"
            rules={[{ required: true, message: 'Vui lòng nhập từ tiếng Việt!' }]}
          >
            <Input placeholder="Nhập từ tiếng Việt" />
          </Form.Item>
          <Form.Item
            name="title_en"
            label="Tiếng Anh"
            rules={[{ required: true, message: 'Vui lòng nhập từ tiếng Anh!' }]}
          >
            <Input placeholder="Nhập từ tiếng Anh" />
          </Form.Item>
          <Form.Item
            name="description_vi"
            label="Mô tả tiếng Việt"
          >
            <Input.TextArea placeholder="Mô tả bằng tiếng Việt" rows={3} />
          </Form.Item>
          <Form.Item
            name="description_en"
            label="Mô tả tiếng Anh"
          >
            <Input.TextArea placeholder="Mô tả bằng tiếng Anh" rows={3} />
          </Form.Item>
          <Form.Item
            name="audio_vi"
            label="Audio tiếng Việt"
          >
            <Input placeholder="URL audio tiếng Việt" />
          </Form.Item>
          <Form.Item
            name="audio_en"
            label="Audio tiếng Anh"
          >
            <Input placeholder="URL audio tiếng Anh" />
          </Form.Item>
          <Form.Item
            name="image"
            label="Hình ảnh"
          >
            <Input placeholder="URL hình ảnh" />
          </Form.Item>
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
    </div>
  );
};

export default AdminVocabulary; 