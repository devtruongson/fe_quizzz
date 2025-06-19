import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Button, Typography, Progress, Spin, Avatar } from 'antd';
import { 
  BookOutlined, 
  TrophyOutlined, 
  UserOutlined, 
  PlayCircleOutlined,
  FireOutlined,
  ThunderboltOutlined,
  StarOutlined,
  RocketOutlined,
  CrownOutlined,
  GiftOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { topicsAPI, userVocabulairesAPI, vocabulairesAPI, userExamsAPI, vocabulaireQuestionsAPI } from '../services/api';
import type { Topic, UserVocabulaire, Vocabulaire, UserExam, VocabulaireQuestion } from '../types';

const { Title, Text } = Typography;

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [vocabs, setVocabs] = useState<Vocabulaire[]>([]);
  const [userProgress, setUserProgress] = useState<UserVocabulaire[]>([]);
  const [userExams, setUserExams] = useState<UserExam[]>([]);
  const [vocabQuestions, setVocabQuestions] = useState<VocabulaireQuestion[]>([]);
  const [recentProgress, setRecentProgress] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [topicsData, vocabsData, userProgressData, userExamsData, vocabQuestionsData] = await Promise.all([
        topicsAPI.getAll(),
        vocabulairesAPI.getAll(),
        userVocabulairesAPI.getByUserId(user.id),
        userExamsAPI.getAll(),
        vocabulaireQuestionsAPI.getAll(),
      ]);
      setTopics(topicsData);
      setVocabs(vocabsData);
      setUserProgress(userProgressData);
      setUserExams(userExamsData.filter(e => e.userId === user.id));
      setVocabQuestions(vocabQuestionsData);
      // Tính recent progress
      const topicProgressArr = topicsData.map(topic => {
        // Tìm vocabulaire thuộc topic
        const topicVocabs = vocabsData.filter(v => v.topicId === topic.id);
        const vocabIds = topicVocabs.map(v => v.id);
        // Tìm các câu hỏi thuộc topic
        const topicQuestions = vocabQuestionsData.filter(q => vocabIds.includes(q.vocabulaireId));
        // Tìm tiến độ user cho topic này
        const topicUserProgress = userProgressData.find(p => {
          try {
            const studiedCardIds = JSON.parse(p.vocabulaireQuestionListId || '[]');
            return studiedCardIds.some((cardId: number) => topicQuestions.some(q => q.id === cardId));
          } catch {
            return false;
          }
        });
        let progress = 0;
        if (topicUserProgress && topicQuestions.length > 0) {
          try {
            const studiedCardIds = JSON.parse(topicUserProgress.vocabulaireQuestionListId || '[]');
            progress = Math.round((studiedCardIds.length / topicQuestions.length) * 100);
          } catch {}
        }
        return {
          id: topic.id,
          title: topic.title,
          progress,
        };
      });
      // Lấy 4 chủ đề gần nhất có tiến độ > 0, sắp xếp theo tiến độ giảm dần
      setRecentProgress(topicProgressArr.filter(t => t.progress > 0).sort((a, b) => b.progress - a.progress).slice(0, 4));
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tính toán các chỉ số
  const totalTopics = topics.length;
  const completedTopics = topics.filter(topic => {
    // Tìm tiến độ
    const topicVocabs = vocabs.filter(v => v.topicId === topic.id);
    const vocabIds = topicVocabs.map(v => v.id);
    const topicQuestions = vocabQuestions.filter(q => vocabIds.includes(q.vocabulaireId));
    const topicUserProgress = userProgress.find(p => {
      try {
        const studiedCardIds = JSON.parse(p.vocabulaireQuestionListId || '[]');
        return studiedCardIds.some((cardId: number) => topicQuestions.some(q => q.id === cardId));
      } catch {
        return false;
      }
    });
    if (topicUserProgress && topicQuestions.length > 0) {
      try {
        const studiedCardIds = JSON.parse(topicUserProgress.vocabulaireQuestionListId || '[]');
        const progress = Math.round((studiedCardIds.length / topicQuestions.length) * 100);
        return progress === 100;
      } catch {
        return false;
      }
    }
    return false;
  }).length;
  const totalVocabulary = vocabs.length;
  // Đếm số từ vựng đã học (unique cardId trong tất cả progress)
  const learnedCardIds = Array.from(new Set(userProgress.flatMap(p => {
    try {
      return JSON.parse(p.vocabulaireQuestionListId || '[]');
    } catch {
      return [];
    }
  })));
  const learnedVocabulary = learnedCardIds.length;
  const totalExams = userExams.length;
  // Giả sử passedExams = số bài thi đã làm (nếu có trường pass/fail thì lọc lại)
  const passedExams = userExams.length;
  // currentStreak: giữ nguyên mock hoặc tính toán nếu có dữ liệu
  const currentStreak = 5;

  // Tìm bài thi gần nhất/chưa hoàn thành (giả sử có trường isCompleted hoặc status, nếu không thì lấy bài mới nhất)
  const handleQuickExam = () => {
    if (userExams.length > 0) {
      // Ưu tiên bài thi chưa hoàn thành, nếu không có thì lấy bài mới nhất
      const unfinishedExam = userExams.find(e => !e.isCompleted && e.status !== 'completed');
      const examToGo = unfinishedExam || userExams[userExams.length - 1];
      if (examToGo) {
        navigate(`/exams/${examToGo.id}`);
        return;
      }
    }
    navigate('/exams');
  };

  // Tìm chủ đề đang học dở (progress < 100%)
  const handleQuickVocab = () => {
    // Tính lại tiến độ từng topic
    const topicProgressArr = topics.map(topic => {
      const topicVocabs = vocabs.filter(v => v.topicId === topic.id);
      const vocabIds = topicVocabs.map(v => v.id);
      const topicQuestions = vocabQuestions.filter(q => vocabIds.includes(q.vocabulaireId));
      const topicUserProgress = userProgress.find(p => {
        try {
          const studiedCardIds = JSON.parse(p.vocabulaireQuestionListId || '[]');
          return studiedCardIds.some((cardId: number) => topicQuestions.some(q => q.id === cardId));
        } catch {
          return false;
        }
      });
      let progress = 0;
      if (topicUserProgress && topicQuestions.length > 0) {
        try {
          const studiedCardIds = JSON.parse(topicUserProgress.vocabulaireQuestionListId || '[]');
          progress = Math.round((studiedCardIds.length / topicQuestions.length) * 100);
        } catch {}
      }
      return {
        id: topic.id,
        progress,
      };
    });
    // Ưu tiên chủ đề đang học dở (0 < progress < 100), nếu không có thì chuyển đến /topics
    const learningTopic = topicProgressArr.find(t => t.progress > 0 && t.progress < 100);
    if (learningTopic) {
      navigate(`/topics/${learningTopic.id}/flashcard`);
      return;
    }
    // Nếu không có chủ đề đang học dở, chuyển đến trang chọn chủ đề
    navigate('/topics');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
              <RocketOutlined className="text-2xl text-white" />
            </div>
          </div>
          <Spin size="large" />
          <div className="mt-4">
            <Text className="text-gray-600 text-lg">Đang tải dashboard...</Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Section với Background Pattern */}
      <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute bottom-20 left-32 w-12 h-12 bg-white rounded-full"></div>
          <div className="absolute bottom-32 right-10 w-24 h-24 bg-white rounded-full"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Avatar 
                size={80} 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-2xl font-bold mr-6"
                icon={<UserOutlined />}
              />
              <div className="text-left">
                <Title level={1} className="!text-white !mb-2 !text-4xl font-bold">
                  Chào mừng trở lại!
                </Title>
                <Text className="text-purple-100 text-xl">
                  {user?.email}
                </Text>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <StarOutlined className="text-yellow-400 text-2xl" />
              <Text className="text-2xl text-purple-100 font-medium">
                Hãy tiếp tục hành trình chinh phục từ vựng
              </Text>
              <StarOutlined className="text-yellow-400 text-2xl" />
            </div>
            <div className="flex items-center justify-center space-x-4 mt-6">
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <FireOutlined className="text-orange-400 mr-2" />
                <Text className="text-white font-medium">{currentStreak} ngày liên tiếp</Text>
              </div>
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <TrophyOutlined className="text-yellow-400 mr-2" />
                <Text className="text-white font-medium">{completedTopics} chủ đề hoàn thành</Text>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="flex flex-wrap -mx-2">
          <div className="w-full sm:w-1/2 lg:w-1/4 px-2 mb-4">
            <div className="text-center rounded-xl border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 p-6">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                  <BookOutlined className="text-2xl text-white" />
                </div>
              </div>
              <Statistic
                title={<span className="text-blue-100 font-medium">Chủ đề đã học</span>}
                value={completedTopics}
                suffix={<span className="text-blue-200">/ {totalTopics}</span>}
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
              />
            </div>
          </div>
          <div className="w-full sm:w-1/2 lg:w-1/4 px-2 mb-4">
            <div className="text-center rounded-xl border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 p-6">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                  <UserOutlined className="text-2xl text-white" />
                </div>
              </div>
              <Statistic
                title={<span className="text-green-100 font-medium">Từ vựng đã học</span>}
                value={learnedVocabulary}
                suffix={<span className="text-green-200">/ {totalVocabulary}</span>}
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
              />
            </div>
          </div>
          <div className="w-full sm:w-1/2 lg:w-1/4 px-2 mb-4">
            <div className="text-center rounded-xl border-0 shadow-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 p-6">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                  <TrophyOutlined className="text-2xl text-white" />
                </div>
              </div>
              <Statistic
                title={<span className="text-yellow-100 font-medium">Bài thi đã làm</span>}
                value={passedExams}
                suffix={<span className="text-yellow-200">/ {totalExams}</span>}
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
              />
            </div>
          </div>
          <div className="w-full sm:w-1/2 lg:w-1/4 px-2 mb-4">
            <div className="text-center rounded-xl border-0 shadow-xl bg-gradient-to-br from-red-500 to-pink-500 text-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 p-6">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                  <FireOutlined className="text-2xl text-white" />
                </div>
              </div>
              <Statistic
                title={<span className="text-red-100 font-medium">Ngày liên tiếp</span>}
                value={currentStreak}
                suffix={<span className="text-red-200">ngày</span>}
                valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Row gutter={[32, 32]}>
          {/* Enhanced Quick Actions */}
          <Col xs={24} lg={12}>
            <Card 
              className="h-full border-0 shadow-xl bg-white/80 backdrop-blur-sm"
              title={
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <ThunderboltOutlined className="text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-800">Hành động nhanh</span>
                </div>
              }
            >
              <div className="space-y-4">
                <Button 
                  type="primary"
                  size="large" 
                  icon={<RocketOutlined />}
                  className="w-full h-14 text-lg font-medium border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px'
                  }}
                  onClick={() => navigate('/topics')}
                >
                  <span className="flex items-center justify-between w-full">
                    Tiếp tục học tập
                    <ArrowRightOutlined />
                  </span>
                </Button>
                
                <Button 
                  size="large" 
                  icon={<CrownOutlined />}
                  className="w-full h-14 text-lg font-medium border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-500 hover:text-yellow-700 transition-all duration-300"
                  style={{ borderRadius: '12px' }}
                  onClick={handleQuickExam}
                >
                  <span className="flex items-center justify-between w-full">
                    Thử thách kiểm tra
                    <ArrowRightOutlined />
                  </span>
                </Button>
                
                <Button 
                  size="large" 
                  icon={<GiftOutlined />}
                  className="w-full h-14 text-lg font-medium border-2 border-green-400 text-green-600 hover:bg-green-50 hover:border-green-500 hover:text-green-700 transition-all duration-300"
                  style={{ borderRadius: '12px' }}
                  onClick={handleQuickVocab}
                >
                  <span className="flex items-center justify-between w-full">
                    Ôn tập từ vựng
                    <ArrowRightOutlined />
                  </span>
                </Button>
              </div>
            </Card>
          </Col>

          {/* Enhanced Recent Progress */}
          <Col xs={24} lg={12}>
            <Card 
              className="h-full border-0 shadow-xl bg-white/80 backdrop-blur-sm"
              title={
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <ClockCircleOutlined className="text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-800">Tiến độ gần đây</span>
                </div>
              }
            >
              <div className="space-y-6">
                {recentProgress.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOutlined className="text-4xl text-gray-300 mb-4" />
                    <Text className="text-gray-400 text-lg">Chưa có tiến độ học nào gần đây.</Text>
                    <div className="mt-4">
                      <Button 
                        type="primary" 
                        ghost 
                        onClick={() => navigate('/topics')}
                        className="border-blue-400 text-blue-600 hover:bg-blue-50"
                      >
                        Bắt đầu học ngay
                      </Button>
                    </div>
                  </div>
                ) : recentProgress.map((topic, index) => (
                  <div key={topic.id} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mr-3 text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <Text className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                          {topic.title}
                        </Text>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Text className="font-bold text-lg text-gray-700">{topic.progress}%</Text>
                        {topic.progress === 100 && <CrownOutlined className="text-yellow-500" />}
                      </div>
                    </div>
                    <div className="relative">
                      <Progress 
                        percent={topic.progress} 
                        size="small"
                        strokeColor={{
                          '0%': topic.progress >= 80 ? '#10b981' : topic.progress >= 60 ? '#f59e0b' : topic.progress >= 40 ? '#3b82f6' : '#ef4444',
                          '100%': topic.progress >= 80 ? '#059669' : topic.progress >= 60 ? '#d97706' : topic.progress >= 40 ? '#2563eb' : '#dc2626',
                        }}
                        showInfo={false}
                        className="group-hover:shadow-md transition-shadow"
                      />
                      {topic.progress > 0 && (
                        <div 
                          className="absolute top-0 h-2 w-1 bg-white rounded-full shadow-md transition-all duration-300"
                          style={{ left: `${Math.max(topic.progress - 1, 0)}%` }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Enhanced Featured Topics */}
        {recentProgress.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4">
                  <StarOutlined className="text-white text-xl" />
                </div>
                <Title level={2} className="!mb-0 !text-3xl font-bold text-gray-800">
                  Chủ đề nổi bật
                </Title>
              </div>
              <Button 
                type="link" 
                className="text-lg font-medium text-purple-600 hover:text-purple-700"
                onClick={() => navigate('/topics')}
              >
                Xem tất cả <ArrowRightOutlined />
              </Button>
            </div>
            <Row gutter={[24, 24]}>
              {recentProgress.map((topic, index) => (
                <Col xs={24} sm={12} lg={6} key={topic.id}>
                  <Card 
                    hoverable 
                    className="text-center cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/90 backdrop-blur-sm overflow-hidden relative group"
                    onClick={() => navigate(`/topics/${topic.id}`)}
                    style={{ borderRadius: '20px' }}
                  >
                    {/* Ranking Badge */}
                    <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                      {index + 1}
                    </div>
                    
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full -translate-y-10 translate-x-10 opacity-30 group-hover:scale-150 transition-transform duration-500"></div>
                    
                    <div className="relative z-10 pt-4">
                      <div className="mb-6">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <BookOutlined className="text-2xl text-white" />
                        </div>
                        {topic.progress === 100 && (
                          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 -translate-y-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                              <CrownOutlined className="text-white text-sm" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Title level={4} className="mb-4 font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                        {topic.title}
                      </Title>
                      
                      <div className="mb-4">
                        <Progress 
                          percent={topic.progress} 
                          strokeColor={{
                            '0%': topic.progress >= 80 ? '#10b981' : topic.progress >= 60 ? '#f59e0b' : topic.progress >= 40 ? '#3b82f6' : '#ef4444',
                            '100%': topic.progress >= 80 ? '#059669' : topic.progress >= 60 ? '#d97706' : topic.progress >= 40 ? '#2563eb' : '#dc2626',
                          }}
                          showInfo={false}
                          className="group-hover:shadow-md transition-shadow"
                        />
                      </div>
                      
                      <div className="flex items-center justify-center space-x-2">
                        <Text className="text-lg font-bold text-gray-700">{topic.progress}%</Text>
                        <Text className="text-gray-500">hoàn thành</Text>
                        {topic.progress >= 80 && <StarOutlined className="text-yellow-500" />}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;