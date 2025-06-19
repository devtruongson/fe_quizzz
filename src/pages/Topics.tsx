import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Button, Input, Spin, Empty, Tag, message } from 'antd';
import { 
  BookOutlined, 
  SearchOutlined, 
  PlayCircleOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  StarOutlined
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Text className="text-gray-600">Đang tải chủ đề...</Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header với gradient background */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-white">
              <Title level={1} className="!text-white !mb-3 font-bold text-4xl">
                <StarOutlined className="mr-3 text-yellow-400" />
                Chủ đề học tập
              </Title>
              <Text className="text-indigo-100 text-lg">
                Khám phá và chinh phục các chủ đề học tập thú vị
              </Text>
            </div>
            <div className="mt-6 sm:mt-0">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-1">
                <Search
                  placeholder="Tìm kiếm chủ đề..."
                  allowClear
                  enterButton={
                    <Button 
                      type="primary" 
                      icon={<SearchOutlined />}
                      className="bg-white text-indigo-600 border-none hover:bg-gray-50"
                    >
                      Tìm kiếm
                    </Button>
                  }
                  size="large"
                  onSearch={handleSearch}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-96"
                  style={{
                    '& .ant-input': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      borderRadius: '12px'
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-xl bg-gradient-to-r from-green-400 to-green-600 border-none text-white shadow-lg p-6 flex items-center">
            <TrophyOutlined className="text-3xl mr-4" />
            <div>
              <Text className="!text-green-100 block">Hoàn thành</Text>
              <Title level={3} className="!text-white !mb-0">
                {topicProgress.filter(p => p.progress === 100).length}
              </Title>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 border-none text-white shadow-lg p-6 flex items-center">
            <PlayCircleOutlined className="text-3xl mr-4" />
            <div>
              <Text className="!text-blue-100 block">Đang học</Text>
              <Title level={3} className="!text-white !mb-0">
                {topicProgress.filter(p => p.progress > 0 && p.progress < 100).length}
              </Title>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-purple-400 to-purple-600 border-none text-white shadow-lg p-6 flex items-center">
            <BookOutlined className="text-3xl mr-4" />
            <div>
              <Text className="!text-purple-100 block">Tổng số</Text>
              <Title level={3} className="!text-white !mb-0">
                {topics.length}
              </Title>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {filteredTopics.length === 0 ? (
          <div className="text-center py-16">
            <Empty
              description={
                <div>
                  <Text className="text-gray-500 text-lg">Không tìm thấy chủ đề nào</Text>
                  <br />
                  <Text className="text-gray-400">Hãy thử tìm kiếm với từ khóa khác</Text>
                </div>
              }
              className="my-16"
            />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredTopics.map((topic) => {
              const progressData = getTopicProgress(topic.id);
              const isCompleted = progressData.progress === 100;
              
              return (
                <Col xs={24} sm={12} lg={8} xl={6} key={topic.id}>
                  <Card
                    hoverable
                    className="h-full cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg group overflow-hidden relative"
                    onClick={() => navigate(`/topics/${topic.id}`)}
                    style={{
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)'
                    }}
                  >
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full -translate-y-10 translate-x-10 opacity-30 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pink-200 to-orange-200 rounded-full translate-y-8 -translate-x-8 opacity-20 group-hover:scale-125 transition-transform duration-500"></div>
                    
                    <div className="text-center relative z-10">
                      <div className="mb-6 relative">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <BookOutlined className="text-2xl text-white" />
                        </div>
                        {isCompleted && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                            <TrophyOutlined className="text-white text-sm" />
                          </div>
                        )}
                      </div>
                      
                      <Title level={4} className="mb-3 line-clamp-2 font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                        {topic.title}
                      </Title>
                      
                      {topic.description && (
                        <Text className="text-gray-600 line-clamp-3 mb-6 block leading-relaxed">
                          {topic.description}
                        </Text>
                      )}
                      
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <Text className="text-sm text-gray-500 font-medium">Tiến độ học tập</Text>
                          <div className="flex items-center">
                            <Text className="text-sm font-bold text-gray-700">{progressData.progress}%</Text>
                            {progressData.progress > 0 && (
                              <ThunderboltOutlined className="ml-1 text-yellow-500" />
                            )}
                          </div>
                        </div>
                        <div className="relative">
                          <div className="w-[90%] mx-auto bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                              className="h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                              style={{
                                width: `${progressData.progress}%`,
                                background: `linear-gradient(90deg, ${getProgressColor(progressData.progress)}, ${getProgressColor(progressData.progress)}dd)`,
                              }}
                            />
                          </div>
                          {progressData.progress > 0 && (
                            <div 
                              className="absolute top-0 h-[13px] w-[13px] rounded-[50%] bg-[blue] shadow-lg transition-all duration-1000"
                              style={{ left: `${Math.max(progressData.progress - 9, 0)}%` }}
                            />
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-center">
                          {isCompleted ? (
                            <Tag 
                              color="success" 
                              icon={<TrophyOutlined />}
                              className="px-4 py-1 rounded-full text-sm font-medium border-0"
                              style={{ background: 'linear-gradient(90deg, #10b981, #059669)', color: "#fff" }}
                            >
                              Hoàn thành xuất sắc
                            </Tag>
                          ) : (
                            <Tag 
                              color="processing" 
                              icon={<PlayCircleOutlined />}
                              className="px-4 py-1 rounded-full text-sm font-medium border-0"
                              style={{ 
                                background: progressData.progress > 0 
                                  ? 'linear-gradient(90deg, #3b82f6, #2563eb)' 
                                  : 'linear-gradient(90deg, #6b7280, #4b5563)',
                                  color: "#fff"
                              }}
                            >
                              {progressData.progress > 0 ? 'Đang tiến bộ' : 'Sẵn sàng học'}
                            </Tag>
                          )}
                        </div>
                        
                        <Button
                          size="middle"
                          className="w-full h-10 rounded-xl border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 font-medium transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/topics/${topic.id}/flashcard`);
                          }}
                        >
                          <PlayCircleOutlined className="mr-2" />
                          Ôn tập từ vựng
                        </Button>
                        
                        <Button
                          size="middle"
                          type="primary"
                          loading={creatingExamId === topic.id}
                          className="w-full h-10 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                          style={{
                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                            border: 'none'
                          }}
                          onClick={(e) => handleCreateExam(topic, e)}
                        >
                          {creatingExamId === topic.id ? (
                            <>Đang tạo bài kiểm tra...</>
                          ) : (
                            <>
                              <ThunderboltOutlined className="mr-2" />
                              Kiểm tra năng lực
                            </>
                          )}
                        </Button>
                      </div>
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