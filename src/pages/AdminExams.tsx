import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Modal, Typography, Tag, Popconfirm, message, Select, Form, Input } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { userExamsAPI, topicsAPI, vocabulaireQuestionsAPI, usersAPI } from '../services/api';
import type { UserExam, UserExamListItem } from '../types';

const { Title, Text } = Typography;

const AdminExams: React.FC = () => {
  const [exams, setExams] = useState<UserExam[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<UserExam | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [addForm] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchExams();
    fetchTopics();
    fetchUsers();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await userExamsAPI.getAll();
      setExams(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách bài thi');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const data = await topicsAPI.getAll();
      setTopics(data);
    } catch {}
  };

  const fetchQuestions = async (topicId: number) => {
    try {
      const all = await vocabulaireQuestionsAPI.getAll();
      // Lọc câu hỏi theo topic
      const topicQuestions = all.filter((q: any) => q.Vocabulaire && q.Vocabulaire.topicId === topicId);
      setQuestions(topicQuestions);
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch {}
  };

  const handleView = (exam: UserExam) => {
    setSelectedExam(exam);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await userExamsAPI.delete(id);
      message.success('Đã xóa bài thi');
      fetchExams();
    } catch (error) {
      message.error('Lỗi khi xóa bài thi');
    }
  };

  const handleOpenAddModal = () => {
    setAddModalVisible(true);
    addForm.resetFields();
    setSelectedTopic(null);
    setQuestions([]);
    setSelectedQuestions([]);
  };

  const handleTopicChange = (topicId: number) => {
    setSelectedTopic(topicId);
    fetchQuestions(topicId);
    setSelectedQuestions([]);
  };

  const handleAddExam = async (values: any) => {
    try {
      // Tạo list bài thi dạng [{questionId, answer: '', isCorrect: false}]
      const list = selectedQuestions.map(qid => ({ questionId: qid, answer: '', isCorrect: false }));
      await userExamsAPI.create({
        userId: 0, // 0 = admin tạo, hoặc có thể cho chọn user nếu muốn
        list: JSON.stringify(list),
        name: values.name || '',
        topicId: selectedTopic,
      });
      message.success('Đã thêm bài thi mới!');
      setAddModalVisible(false);
      fetchExams();
    } catch (err) {
      message.error('Lỗi khi thêm bài thi');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Người làm bài',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: number) => {
        const user = users.find(u => u.id === userId);
        return user ? (user.name || user.email || user.username || user.id) : <span style={{color:'#888'}}>Không xác định</span>;
      }
    },
    {
      title: 'Số câu',
      key: 'numQuestions',
      render: (_: any, record: UserExam) => {
        try {
          const list: UserExamListItem[] = JSON.parse(record.list || '[]');
          return list.length;
        } catch {
          return 0;
        }
      },
    },
    {
      title: 'Điểm',
      key: 'score',
      render: (_: any, record: UserExam) => {
        try {
          const list: UserExamListItem[] = JSON.parse(record.list || '[]');
          const correct = list.filter(q => q.isCorrect).length;
          return `${correct} / ${list.length}`;
        } catch {
          return '0';
        }
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: UserExam) => (
        <>
          <Button icon={<EyeOutlined />} onClick={() => handleView(record)}>
            Xem
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa bài thi này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} danger className="ml-2">
              Xóa
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <Title level={2}>Quản trị bài thi</Title>
          <Button type="primary" style={{
            display: "none"
          }} onClick={handleOpenAddModal}>Thêm bài thi</Button>
        </div>
        <Table
          columns={columns}
          dataSource={exams}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
        title="Chi tiết bài thi"
      >
        {selectedExam && (
          <div>
            <Text strong>Người làm bài:</Text> {(() => {
              const user = users.find(u => u.id === selectedExam.userId);
              return user ? (user.name || user.email || user.username || user.id) : <span style={{color:'#888'}}>Không xác định</span>;
            })()}
            <br />
            <Text strong>Số câu:</Text> {(() => {
              try {
                return JSON.parse(selectedExam.list || '[]').length;
              } catch {
                return 0;
              }
            })()}
            <br />
            <Text strong>Điểm:</Text> {(() => {
              try {
                const list: UserExamListItem[] = JSON.parse(selectedExam.list || '[]');
                const correct = list.filter(q => q.isCorrect).length;
                return `${correct} / ${list.length}`;
              } catch {
                return '0';
              }
            })()}
            <br />
            <div className="mt-4">
              <Table
                columns={[
                  { title: 'Câu hỏi ID', dataIndex: 'questionId', key: 'questionId' },
                  { title: 'Đáp án', dataIndex: 'answer', key: 'answer' },
                  { title: 'Kết quả', key: 'isCorrect', render: (_: any, record: UserExamListItem) => (
                    record.isCorrect ? <Tag color="green">Đúng</Tag> : <Tag color="red">Sai</Tag>
                  ) },
                ]}
                dataSource={(() => {
                  try {
                    return JSON.parse(selectedExam.list || '[]');
                  } catch {
                    return [];
                  }
                })()}
                rowKey="questionId"
                pagination={false}
                size="small"
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        title="Tạo bài thi mới cho chủ đề"
        onOk={() => addForm.submit()}
        okText="Tạo bài thi"
        width={600}
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddExam}>
          <Form.Item label="Chủ đề" name="topicId" rules={[{ required: true, message: 'Chọn chủ đề' }]}> 
            <Select
              placeholder="Chọn chủ đề"
              onChange={handleTopicChange}
              value={selectedTopic || undefined}
            >
              {topics.map(t => <Select.Option key={t.id} value={t.id}>{t.title}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="Tên bài thi" name="name">
            <Input placeholder="Nhập tên bài thi (tuỳ chọn)" />
          </Form.Item>
          <Form.Item label="Chọn câu hỏi" required>
            <Select
              mode="multiple"
              placeholder="Chọn các câu hỏi cho bài thi"
              value={selectedQuestions}
              onChange={setSelectedQuestions}
              style={{ width: '100%' }}
              disabled={!selectedTopic}
            >
              {questions.map(q => (
                <Select.Option key={q.id} value={q.id}>
                  {q.title_en || q.title_vi || `Câu hỏi ${q.id}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminExams; 