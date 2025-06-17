import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Typography, Spin, message, Progress, Modal } from 'antd';
import { LeftOutlined, RightOutlined, SoundOutlined, TrophyOutlined } from '@ant-design/icons';
import { topicsAPI, vocabulairesAPI, vocabulaireQuestionsAPI, userVocabulairesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Topic, Vocabulaire, VocabulaireQuestion, UserVocabulaire } from '../types';

const { Title, Text } = Typography;

function shuffle<T>(arr: T[]): T[] {
  return arr.slice().sort(() => Math.random() - 0.5);
}

const TopicFlashcard: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [cards, setCards] = useState<VocabulaireQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<UserVocabulaire | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCallAPI, setIsCallAPI] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [topicId]);

  useEffect(() => {
    if (user && topicId && cards.length > 0) {
      loadCurrentProgress();
    }
  }, [user, topicId, cards]);

  const loadCurrentProgress = async () => {
    if (!user || cards.length === 0) return;
    
    try {
      console.log('Loading current progress for user:', user.id, 'topic:', topicId);
      const userProgress = await userVocabulairesAPI.getByUserId(user.id);
      console.log('User progress:', userProgress);
      
      // Tìm progress cho topic này (nếu có)
      // Sẽ tìm progress có vocabulaireQuestionListId chứa card của topic này
      const topicProgress = userProgress.find(p => {
        try {
          const cardIds = JSON.parse(p.vocabulaireQuestionListId || '[]');
          return cardIds.some((cardId: number) => 
            cards.some(card => card.id === cardId)
          );
        } catch {
          return false;
        }
      });
      
      setCurrentProgress(topicProgress || null);
      console.log('Found topic progress:', topicProgress);
      
      if (topicProgress) {
        // Nếu đã có progress, load lại tiến độ cũ
        try {
          const studiedCardIds = JSON.parse(topicProgress.vocabulaireQuestionListId || '[]');
          setStudiedCards(new Set(studiedCardIds));
          console.log('Loaded studied cards:', studiedCardIds);
          
          // Check nếu đã hoàn thành 100%
          const progressPercent = Math.round((studiedCardIds.length / cards.length) * 100);
          if (progressPercent === 100) {
            setIsCompleted(true);
            setIsCallAPI(false);
          }
        } catch (error) {
          console.error('Error parsing vocabulaireQuestionListId:', error);
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [topicData, vocabulaires, questions] = await Promise.all([
        topicsAPI.getById(Number(topicId)),
        vocabulairesAPI.getAll(),
        vocabulaireQuestionsAPI.getAll()
      ]);
      setTopic(topicData);
      // Lọc các vocabulaire thuộc topic này
      const topicVocabs = vocabulaires.filter((v: Vocabulaire) => v.topicId === Number(topicId));
      const vocabIds = topicVocabs.map((v: Vocabulaire) => v.id);
      const topicQuestions = questions.filter((q: VocabulaireQuestion) => vocabIds.includes(q.vocabulaireId));
      setCards(shuffle(topicQuestions));
      setCurrent(0);
      setFlipped(false);
      // Không reset studiedCards ở đây, sẽ được load từ progress
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu chủ đề hoặc từ vựng');
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setFlipped(f => !f);
    saveProgress();
    if (!studiedCards.has(cards[current].id)) {
      const newStudiedCards = new Set([...studiedCards, cards[current].id]);
      setStudiedCards(newStudiedCards);
    }
  };

  const handleNext = () => {
    setCurrent(c => (c + 1 < cards.length ? c + 1 : 0));
    setFlipped(false);
  };

  const handlePrev = () => {
    setCurrent(c => (c - 1 >= 0 ? c - 1 : cards.length - 1));
    setFlipped(false);
  };

  const handleAudio = (url?: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play();
    }
  };

  const saveProgress = async () => {
    if (!user || !isCallAPI) {
      console.log('No user found or already completed');
      return;
    }

    try {
      console.log('Starting to save progress...');
      console.log('Studied cards:', Array.from(studiedCards));
      console.log('Total cards:', cards.length);
      
      const progressPercent = Math.round((studiedCards.size / cards.length) * 100);
      const status = progressPercent === 100 ? 'completed' : progressPercent > 0 ? 'doing' : 'start';
      
      console.log('Progress percent:', progressPercent);
      console.log('Status:', status);
      
      // Lưu tiến độ tổng hợp cho topic
      const progressData = {
        userId: user.id,
        vocabulaireId: cards[0]?.vocabulaireId || 1, // Dùng vocabulaire đầu tiên làm representative
        status,
        percentComplete: progressPercent,
        vocabulaireQuestionListId: JSON.stringify(Array.from(studiedCards))
      };

      if (currentProgress) {
        // Cập nhật tiến độ hiện có
        console.log('Updating existing progress with ID:', currentProgress.id);
        const updatedProgress = await userVocabulairesAPI.update(currentProgress.id, progressData as any);
        console.log('Updated progress:', updatedProgress);
        setCurrentProgress(updatedProgress);
      } else {
        // Tạo tiến độ mới
        console.log('Creating new progress record');
        const newProgress = await userVocabulairesAPI.create(progressData as any);
        console.log('Created progress:', newProgress);
        setCurrentProgress(newProgress);
      }

      message.success(`Đã lưu tiến độ học: ${studiedCards.size}/${cards.length} từ vựng`);
      await loadCurrentProgress();
      
    } catch (error) {
      console.error('Lỗi khi lưu tiến độ:', error);
      message.error('Không thể lưu tiến độ học');
    }
  };

  const handleComplete = () => {
    setShowCompletionModal(true);
  };

  const handleFinishLearning = async () => {
    console.log('Finishing learning session...');
    // Chỉ lưu nếu chưa hoàn thành 100%
    if (studiedCards.size < cards.length) {
      await saveProgress();
    }
    setShowCompletionModal(false);
    
    // Thêm delay để đảm bảo API call hoàn thành
    setTimeout(() => {
      navigate('/topics');
    }, 500);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spin size="large" /></div>;
  }
  if (!topic || cards.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Không có từ vựng nào trong chủ đề này.</div>;
  }

  const card = cards[current];
  const progressPercent = Math.round((studiedCards.size / cards.length) * 100);
  const isCurrentlyCompleted = studiedCards.size === cards.length;
  const cardStyles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem 1rem',
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
    },
    header: {
      marginBottom: '2rem',
      width: '100%',
      maxWidth: '36rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      textAlign: 'center' as const,
      flex: 1,
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: '1.5rem',
      margin: 0,
    },
    progressContainer: {
      position: 'absolute' as const,
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '300px',
      zIndex: 1001,
      display: 'none',
    },
    flashcardContainer: {
      position: 'relative' as const,
      width: '350px',
      height: '400px',
      marginBottom: '2rem',
      perspective: '1200px',
    },
    flashcard: {
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
      transformStyle: 'preserve-3d' as const,
      transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      cursor: 'pointer',
    },
    cardSide: {
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
      borderRadius: '20px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      backfaceVisibility: 'hidden' as const,
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      border: '2px solid rgba(255,255,255,0.2)',
      padding: '2rem',
    },
    frontSide: {
      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      color: '#1e293b',
    },
    backSide: {
      background: 'linear-gradient(145deg, #4f46e5 0%, #7c3aed 100%)',
      color: '#ffffff',
      transform: 'rotateY(180deg)',
    },
    image: {
      width: '120px',
      height: '120px',
      objectFit: 'contain' as const,
      borderRadius: '15px',
      marginBottom: '1rem',
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    },
    cardTitle: {
      fontSize: '1.75rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      textAlign: 'center' as const,
    },
    cardDescription: {
      fontSize: '1.1rem',
      textAlign: 'center' as const,
      marginTop: '0.5rem',
      lineHeight: 1.5,
    },
    hintText: {
      position: 'absolute' as const,
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '0.875rem',
      fontWeight: '500',
      opacity: 0.7,
    },
    navigation: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem',
      marginTop: '1rem',
    },
    counter: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#ffffff',
    },
    navButton: {
      background: 'rgba(255,255,255,0.9)',
      border: 'none',
      borderRadius: '50%',
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transition: 'all 0.2s ease',
    },
    completeButton: {
      background: 'linear-gradient(145deg, #10b981 0%, #059669 100%)',
      border: 'none',
      borderRadius: '25px',
      padding: '12px 24px',
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: '1rem',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
      transition: 'all 0.2s ease',
      marginTop: '1rem',
    },
  };


  // Nếu đã hoàn thành 100%, hiển thị màn hình complete
  if (isCompleted) {
    return (
      <div style={cardStyles.container}>
        <div style={cardStyles.header}>
          <Button 
            icon={<LeftOutlined />} 
            onClick={() => navigate(-1)} 
            size="large" 
            type="text"
            style={{ color: '#ffffff' ,
              position: 'absolute',
              left: '20px',
              top: '20px',
            }}
          >
            Quay lại
          </Button>
          <h1 style={cardStyles.title}>{topic.title}</h1>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,255,255,0.2)',
        }}>
          <TrophyOutlined style={{ fontSize: '4rem', color: '#fbbf24', marginBottom: '1rem' }} />
          <Title level={2} style={{ color: '#ffffff', marginBottom: '1rem' }}>
            Chủ đề đã hoàn thành!
          </Title>
          <Text style={{ color: '#e2e8f0', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Bạn đã học thành công tất cả <strong>{cards.length}</strong> từ vựng trong chủ đề "{topic.title}".
          </Text>
          <Progress 
            percent={100} 
            strokeColor="#fbbf24"
            format={() => `${cards.length}/${cards.length}`}
            strokeWidth={8}
            style={{ marginBottom: '2rem' }}
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/topics')}
              style={{
                background: 'linear-gradient(145deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '25px',
                padding: '12px 24px',
                fontWeight: 'bold',
              }}
            >
              Quay về danh sách chủ đề
            </Button>
            <Button
              size="large"
              onClick={() => setIsCompleted(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '25px',
                padding: '12px 24px',
                fontWeight: 'bold',
                color: '#ffffff',
              }}
            >
              Học lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyles.container}>
      <div style={cardStyles.header}>
        <Button 
          icon={<LeftOutlined />} 
          onClick={() => navigate(-1)} 
          size="large" 
          type="text"
          style={{ color: '#ffffff' ,
            position: 'absolute',
            left: '20px',
            top: '20px',
          }}
        >
          Quay lại
        </Button>
        <h1 style={cardStyles.title}>{topic.title}</h1>
      </div>

      {/* Progress Bar */}
      <div style={cardStyles.progressContainer}>
        <Progress 
          percent={progressPercent} 
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          format={() => `${studiedCards.size}/${cards.length}`}
          strokeWidth={8}
        />
        {isCurrentlyCompleted && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'linear-gradient(145deg, #fbbf24 0%, #f59e0b 100%)',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '1rem',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
          }}>
            🎉 Đã hoàn thành! Bạn có thể tiếp tục học để ôn tập
          </div>
        )}
        
        {/* Debug Info */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#ffffff'
        }}>
          <div>User ID: {user?.id}</div>
          <div>Topic ID: {topicId}</div>
          <div>Progress ID: {currentProgress?.id || 'None'}</div>
          <div>Status: {currentProgress?.status || 'start'}</div>
          <Button 
            size="small" 
            onClick={saveProgress}
            style={{ marginTop: '0.5rem' }}
          >
            Test Save Progress
          </Button>
        </div>
      </div>
      
      <div style={cardStyles.flashcardContainer}>
        <div style={cardStyles.flashcard} onClick={handleFlip}>
          {/* Front Side - English */}
          <div style={{ ...cardStyles.cardSide, ...cardStyles.frontSide }}>
            {card.image && (
              <img src={card.image} alt="Vocabulary" style={cardStyles.image} />
            )}
            <h2 style={{ ...cardStyles.cardTitle, color: '#1e293b' }}>{card.title_en}</h2>
            {card.audio_en && (
              <Button 
                icon={<SoundOutlined />} 
                shape="circle" 
                onClick={(e) => { e.stopPropagation(); handleAudio(card.audio_en); }}
                style={{ marginBottom: '0.5rem' }}
              />
            )}
            <p style={{ ...cardStyles.cardDescription, color: '#64748b' }}>
              {card.description_en}
            </p>
            <span style={{ ...cardStyles.hintText, color: '#6366f1' }}>
              Click để xem tiếng Việt
            </span>
          </div>
          
          {/* Back Side - Vietnamese */}
          <div style={{ ...cardStyles.cardSide, ...cardStyles.backSide }}>
            <h2 style={{ ...cardStyles.cardTitle, color: '#ffffff' }}>{card.title_vi}</h2>
            {card.audio_vi && (
              <Button 
                icon={<SoundOutlined />} 
                shape="circle" 
                onClick={(e) => { e.stopPropagation(); handleAudio(card.audio_vi); }}
                style={{ marginBottom: '0.5rem' }}
              />
            )}
            <p style={{ ...cardStyles.cardDescription, color: '#e2e8f0' }}>
              {card.description_vi}
            </p>
            <span style={{ ...cardStyles.hintText, color: '#cbd5e1' }}>
              Click để xem tiếng Anh
            </span>
          </div>
        </div>
      </div>
      
      <div style={cardStyles.navigation}>
        <button 
          style={cardStyles.navButton}
          onClick={handlePrev}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = 'rgba(255,255,255,1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
          }}
        >
          <LeftOutlined style={{ fontSize: '18px', color: '#4f46e5' }} />
        </button>
        <span style={cardStyles.counter}>{current + 1} / {cards.length}</span>
        <button 
          style={cardStyles.navButton}
          onClick={handleNext}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = 'rgba(255,255,255,1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
          }}
        >
          <RightOutlined style={{ fontSize: '18px', color: '#4f46e5' }} />
        </button>
      </div>

      {/* Completion Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center', color: '#10b981' }}>
            <TrophyOutlined style={{ fontSize: '2rem', marginRight: '0.5rem' }} />
            Chúc mừng!
          </div>
        }
        open={showCompletionModal}
        onOk={handleFinishLearning}
        onCancel={() => setShowCompletionModal(false)}
        okText="Hoàn thành"
        cancelText="Tiếp tục học"
        centered
      >
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <Title level={3} style={{ color: '#10b981' }}>
            Bạn đã hoàn thành chủ đề "{topic.title}"!
          </Title>
          <Text style={{ fontSize: '1.1rem' }}>
            Đã học thành công <strong>{cards.length}</strong> từ vựng.
          </Text>
          <br />
          <Text style={{ color: '#666' }}>
            Tiến độ học tập sẽ được lưu vào hệ thống.
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default TopicFlashcard; 