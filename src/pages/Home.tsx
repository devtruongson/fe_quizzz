import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Button, Typography, Progress, Spin } from 'antd';
import { 
  BookOutlined, 
  TrophyOutlined, 
  UserOutlined, 
  PlayCircleOutlined,
  FireOutlined 
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Title level={1} className="text-white mb-4">
              Chào mừng trở lại, {user?.email}!
            </Title>
            <Text className="text-xl text-primary-100">
              Hãy tiếp tục hành trình học từ vựng của bạn
            </Text>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center">
              <Statistic
                title="Chủ đề đã học"
                value={completedTopics}
                suffix={`/ ${totalTopics}`}
                prefix={<BookOutlined className="text-primary-600" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center">
              <Statistic
                title="Từ vựng đã học"
                value={learnedVocabulary}
                suffix={`/ ${totalVocabulary}`}
                prefix={<UserOutlined className="text-green-600" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center">
              <Statistic
                title="Bài thi đã làm"
                value={passedExams}
                suffix={`/ ${totalExams}`}
                prefix={<TrophyOutlined className="text-yellow-600" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="text-center">
              <Statistic
                title="Ngày liên tiếp"
                value={currentStreak}
                suffix="ngày"
                prefix={<FireOutlined className="text-red-600" />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Row gutter={[24, 24]}>
          {/* Quick Actions */}
          <Col xs={24} lg={12}>
            <Card title="Hành động nhanh" className="h-full">
              <div className="space-y-4">
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<PlayCircleOutlined />}
                  className="w-full h-12 bg-primary-600 hover:bg-primary-700"
                  onClick={() => navigate('/topics')}
                >
                  Tiếp tục học
                </Button>
                <Button 
                  size="large" 
                  icon={<TrophyOutlined />}
                  className="w-full h-12"
                  onClick={handleQuickExam}
                >
                  Làm bài thi
                </Button>
                <Button 
                  size="large" 
                  icon={<BookOutlined />}
                  className="w-full h-12"
                  onClick={handleQuickVocab}
                >
                  Ôn tập từ vựng
                </Button>
              </div>
            </Card>
          </Col>

          {/* Recent Progress */}
          <Col xs={24} lg={12}>
            <Card title="Tiến độ gần đây" className="h-full">
              <div className="space-y-4">
                {recentProgress.length === 0 ? (
                  <Text className="text-gray-400">Chưa có tiến độ học nào gần đây.</Text>
                ) : recentProgress.map((topic) => (
                  <div key={topic.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <Text className="font-medium">{topic.title}</Text>
                      <Progress 
                        percent={topic.progress} 
                        size="small" 
                        strokeColor={topic.progress >= 80 ? '#10b981' : topic.progress >= 60 ? '#f59e0b' : topic.progress >= 40 ? '#3b82f6' : '#ef4444'}
                        showInfo={false}
                      />
                    </div>
                    <Text className="text-gray-500 ml-4">{topic.progress}%</Text>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Featured Topics */}
        <div className="mt-8">
          <Title level={3} className="mb-6">Chủ đề nổi bật</Title>
          <Row gutter={[16, 16]}>
            {recentProgress.map((topic) => (
              <Col xs={24} sm={12} lg={6} key={topic.id}>
                <Card 
                  hoverable 
                  className="text-center cursor-pointer"
                  onClick={() => navigate(`/topics/${topic.id}`)}
                >
                  <div className="mb-4">
                    <BookOutlined className="text-4xl text-primary-600" />
                  </div>
                  <Title level={4} className="mb-2">{topic.title}</Title>
                  <Progress 
                    percent={topic.progress} 
                    strokeColor={topic.progress >= 80 ? '#10b981' : topic.progress >= 60 ? '#f59e0b' : topic.progress >= 40 ? '#3b82f6' : '#ef4444'}
                    showInfo={false}
                  />
                  <Text className="text-gray-500">{topic.progress}% hoàn thành</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </div>
  );
};

export default Home; 