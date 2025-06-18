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
  Statistic,
  Upload
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { topicsAPI, vocabulairesAPI, vocabulaireQuestionsAPI, uploadAPI } from '../services/api';
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
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    audio_vi?: string;
    audio_en?: string;
    image?: string;
  }>({});
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
    setUploadedFiles({});
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: VocabulaireQuestion, topicId: number) => {
    setEditingItem(record);
    setCurrentTopicId(topicId);
    setUploadedFiles({
      audio_vi: record.audio_vi,
      audio_en: record.audio_en,
      image: record.image
    });
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
        if (currentTopicId === null) {
          message.error('Không tìm thấy chủ đề');
          return;
        }
        
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

  // Hàm xử lý upload file
  const handleFileUpload = async (file: File, fieldName: string) => {
    try {
      setUploading(true);
      const fileUrl = await uploadAPI.uploadSingle(file);
      form.setFieldsValue({ [fieldName]: fileUrl });
      setUploadedFiles(prev => ({ ...prev, [fieldName]: fileUrl }));
      message.success('Upload file thành công');
    } catch (error) {
      message.error('Lỗi khi upload file');
    } finally {
      setUploading(false);
    }
  };

  // Custom upload props cho audio và image
  const uploadProps = (fieldName: string) => ({
    beforeUpload: (file: File) => {
      // Validation file size (max 10MB)
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File phải nhỏ hơn 10MB!');
        return false;
      }

      // Validation file type
      const isAudio = fieldName.includes('audio');
      const isImage = fieldName.includes('image');
      
      if (isAudio) {
        const isValidAudio = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg'].includes(file.type);
        if (!isValidAudio) {
          message.error('Chỉ chấp nhận file audio (MP3, WAV, M4A)!');
          return false;
        }
      }
      
      if (isImage) {
        const isValidImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
        if (!isValidImage) {
          message.error('Chỉ chấp nhận file hình ảnh (JPG, PNG, GIF, WEBP)!');
          return false;
        }
      }

      handleFileUpload(file, fieldName);
      return false; // Ngăn không cho upload tự động
    },
    showUploadList: false,
    accept: fieldName.includes('audio') ? '.mp3,.wav,.m4a' : '.jpg,.jpeg,.png,.gif,.webp',
  });

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
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input placeholder="URL audio tiếng Việt" />
              <Upload {...uploadProps('audio_vi')}>
                <Button icon={<UploadOutlined />} loading={uploading}>
                  Chọn file audio tiếng Việt
                </Button>
              </Upload>
              {uploadedFiles.audio_vi && (
                <div>
                  <audio controls style={{ width: '100%' }}>
                    <source src={uploadedFiles.audio_vi} type="audio/mpeg" />
                    Trình duyệt không hỗ trợ audio.
                  </audio>
                </div>
              )}
            </Space>
          </Form.Item>
          <Form.Item
            name="audio_en"
            label="Audio tiếng Anh"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input placeholder="URL audio tiếng Anh" />
              <Upload {...uploadProps('audio_en')}>
                <Button icon={<UploadOutlined />} loading={uploading}>
                  Chọn file audio tiếng Anh
                </Button>
              </Upload>
              {uploadedFiles.audio_en && (
                <div>
                  <audio controls style={{ width: '100%' }}>
                    <source src={uploadedFiles.audio_en} type="audio/mpeg" />
                    Trình duyệt không hỗ trợ audio.
                  </audio>
                </div>
              )}
            </Space>
          </Form.Item>
          <Form.Item
            name="image"
            label="Hình ảnh"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input placeholder="URL hình ảnh" />
              <Upload {...uploadProps('image')}>
                <Button icon={<UploadOutlined />} loading={uploading}>
                  Chọn file hình ảnh
                </Button>
              </Upload>
              {uploadedFiles.image && (
                <div>
                  <img 
                    src={uploadedFiles.image} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                  />
                </div>
              )}
            </Space>
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