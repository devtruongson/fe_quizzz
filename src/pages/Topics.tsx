import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Button, Input, Spin, Empty, Tag, message } from 'antd';
import { 
  BookOutlined, 
  SearchOutlined, 
  PlayCircleOutlined,
  TrophyOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Topic, UserVocabulaire, Vocabulaire, VocabulaireQuestion } from '../types';
import { topicsAPI, userVocabulairesAPI, vocabulairesAPI, vocabulaireQuestionsAPI, userExamsAPI } from '../services/api';

const { Title, Text } = Typography;
const { Search } = Input;

interface TopicProgress {
  topicId: number;
  progress: number;
  status: 'start' | 'doing' | 'completed';
}

const Topics: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creatingExamId, setCreatingExamId] = useState<number | null>(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (user && topics.length > 0) {
      fetchTopicProgress();
    }
  }, [user, topics]);

  useEffect(() => {
    const filtered = topics.filter(topic =>
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (topic.description && topic.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredTopics(filtered);
  }, [topics, searchTerm]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const data = await topicsAPI.getAll();
      setTopics(data);
      setFilteredTopics(data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicProgress = async () => {
    if (!user) return;

    try {
      console.log('Fetching topic progress for user:', user.id);
      
      // Load tất cả dữ liệu cần thiết
      const [userProgress, vocabulaires, vocabulaireQuestions] = await Promise.all([
        userVocabulairesAPI.getByUserId(user.id),
        vocabulairesAPI.getAll(),
        vocabulaireQuestionsAPI.getAll()
      ]);

      console.log('User progress:', userProgress);
      console.log('Vocabulaires:', vocabulaires);
      console.log('Vocabulaire questions:', vocabulaireQuestions);

      // Tính tiến độ cho từng topic
      const progressMap: TopicProgress[] = [];

      for (const topic of topics) {
        // Tìm tất cả vocabulaire thuộc topic này
        const topicVocabs = vocabulaires.filter(v => v.topicId === topic.id);
        const vocabIds = topicVocabs.map(v => v.id);
        
        // Tìm tất cả câu hỏi thuộc vocabulaire của topic này
        const topicQuestions = vocabulaireQuestions.filter(q => vocabIds.includes(q.vocabulaireId));
        
        if (topicQuestions.length === 0) {
          progressMap.push({
            topicId: topic.id,
            progress: 0,
            status: 'start'
          });
          continue;
        }

        // Tìm progress của user cho topic này
        const topicUserProgress = userProgress.find(p => {
          try {
            const studiedCardIds = JSON.parse(p.vocabulaireQuestionListId || '[]');
            return studiedCardIds.some((cardId: number) => 
              topicQuestions.some(q => q.id === cardId)
            );
          } catch {
            return false;
          }
        });

        if (topicUserProgress) {
          try {
            const studiedCardIds = JSON.parse(topicUserProgress.vocabulaireQuestionListId || '[]');
            const progress = Math.round((studiedCardIds.length / topicQuestions.length) * 100);
            
            progressMap.push({
              topicId: topic.id,
              progress: Math.min(progress, 100), // Đảm bảo không vượt quá 100%
              status: topicUserProgress.status
            });
          } catch (error) {
            console.error('Error parsing progress for topic:', topic.id, error);
            progressMap.push({
              topicId: topic.id,
              progress: 0,
              status: 'start'
            });
          }
        } else {
          progressMap.push({
            topicId: topic.id,
            progress: 0,
            status: 'start'
          });
        }
      }

      console.log('Calculated topic progress:', progressMap);
      setTopicProgress(progressMap);
    } catch (error) {
      console.error('Error fetching topic progress:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#10b981';
    if (progress >= 60) return '#f59e0b';
    if (progress >= 40) return '#3b82f6';
    return '#ef4444';
  };

  const getTopicProgress = (topicId: number): TopicProgress => {
    const progress = topicProgress.find(p => p.topicId === topicId);
    return progress || { topicId, progress: 0, status: 'start' };
  };

  const handleCreateExam = async (topic: Topic, e: React.MouseEvent) => {
    e.stopPropagation();
    setCreatingExamId(topic.id);
    try {
      const vocabs = await vocabulairesAPI.getAll();
      const questions = await vocabulaireQuestionsAPI.getAll();
      const topicVocabs = vocabs.filter(v => v.topicId === topic.id);
      const vocabIds = topicVocabs.map(v => v.id);
      const topicQuestions = questions.filter(q => vocabIds.includes(q.vocabulaireId));
      if (topicQuestions.length === 0) {
        message.warning('Chủ đề này chưa có câu hỏi!');
        setCreatingExamId(null);
        return;
      }
      const list = topicQuestions.map(q => ({ questionId: q.id, answer: '', isCorrect: false }));
      const exam = await userExamsAPI.create({
        userId: user?.id,
        list: JSON.stringify(list),
        topicId: topic.id,
        name: `Kiểm tra chủ đề: ${topic.title}`
      });
      message.success('Đã tạo bài kiểm tra!');
      navigate(`/exams/${exam.id}`);
    } catch (err) {
      message.error('Lỗi khi tạo bài kiểm tra');
    } finally {
      setCreatingExamId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Title level={2} className="mb-2">Chủ đề học tập</Title>
              <Text className="text-gray-600">
                Chọn chủ đề bạn muốn học
              </Text>
            </div>
            <div className="mt-4 sm:mt-0">
              <Search
                placeholder="Tìm kiếm chủ đề..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredTopics.length === 0 ? (
          <Empty
            description="Không tìm thấy chủ đề nào"
            className="my-16"
          />
        ) : (
          <Row gutter={[24, 24]}>
            {filteredTopics.map((topic) => {
              const progressData = getTopicProgress(topic.id);
              const isCompleted = progressData.progress === 100;
              
              return (
                <Col xs={24} sm={12} lg={8} xl={6} key={topic.id}>
                  <Card
                    hoverable
                    className="h-full cursor-pointer transition-all duration-200 hover:shadow-lg"
                    onClick={() => navigate(`/topics/${topic.id}`)}
                  >
                    <div className="text-center">
                      <div className="mb-4">
                        <BookOutlined className="text-4xl text-primary-600" />
                      </div>
                      
                      <Title level={4} className="mb-2 line-clamp-2">
                        {topic.title}
                      </Title>
                      
                      {topic.description && (
                        <Text className="text-gray-600 line-clamp-3 mb-4 block">
                          {topic.description}
                        </Text>
                      )}
                      
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <Text className="text-sm text-gray-500">Tiến độ</Text>
                          <Text className="text-sm font-medium">{progressData.progress}%</Text>
                        </div>
                        <div 
                          className="w-full bg-gray-200 rounded-full h-2"
                          style={{ backgroundColor: '#e5e7eb' }}
                        >
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${progressData.progress}%`,
                              backgroundColor: getProgressColor(progressData.progress),
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2">
                        {isCompleted ? (
                          <Tag color="success" icon={<TrophyOutlined />}>
                            Hoàn thành
                          </Tag>
                        ) : (
                          <Tag color="processing" icon={<PlayCircleOutlined />}>
                            {progressData.progress > 0 ? 'Đang học' : 'Chưa học'}
                          </Tag>
                        )}
                        <Button
                          size="small"
                          icon={<BookOutlined />}
                          className="w-full h-[30px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/topics/${topic.id}/flashcard`);
                          }}
                        >
                          Ôn tập từ vựng
                        </Button>
                      </div>
                      <Button
                          size="small"
                          type="primary"
                          loading={creatingExamId === topic.id}
                          className="w-full h-[30px] mt-[10px]"
                          onClick={(e) => handleCreateExam(topic, e)}
                        >
                          Kiểm tra
                        </Button>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    </div>
  );
};

export default Topics; 