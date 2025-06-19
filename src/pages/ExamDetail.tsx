import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Progress, message, Spin } from 'antd';
import { LeftOutlined, RightOutlined, CheckCircleTwoTone, CloseCircleTwoTone, TrophyOutlined, BookOutlined } from '@ant-design/icons';
import { userExamsAPI, vocabulaireQuestionsAPI } from '../services/api';
import type { UserExam, UserExamListItem, VocabulaireQuestion } from '../types';

const { Title, Text } = Typography;

const feedbacks = {
  correct: [
    'Chính xác! Tuyệt vời!',
    'Giỏi lắm!',
    'Xuất sắc!',
    'Bạn làm rất tốt!'
  ],
  wrong: [
    'Chưa đúng, hãy cố gắng nhé!',
    'Sai rồi, thử lại nhé!',
    'Đừng nản, bạn sẽ làm được!',
    'Cố lên, bạn sẽ tiến bộ!'
  ]
};

function getRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  return arr.slice().sort(() => Math.random() - 0.5);
}

const ExamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<UserExam | null>(null);
  const [questions, setQuestions] = useState<VocabulaireQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState('');
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [optionsState, setOptionsState] = useState<string[][]>([]);

  useEffect(() => {
    fetchExam();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (questions.length) {
      const allOptions = questions.map((q, idx) => {
        const correctAnswer = q.title_en;
        const otherQuestions = questions.filter(qq => qq.id !== q.id);
        let wrongAnswers = otherQuestions.map(qq => qq.title_en).filter(Boolean);
        wrongAnswers = wrongAnswers.filter(ans => ans !== correctAnswer);
        wrongAnswers = shuffle(wrongAnswers).slice(0, 3);
        return shuffle([correctAnswer, ...wrongAnswers]);
      });
      setOptionsState(allOptions);
    }
  }, [questions]);

  const fetchExam = async () => {
    setLoading(true);
    try {
      const examData = await userExamsAPI.getById(Number(id));
      setExam(examData);
      const list: UserExamListItem[] = JSON.parse(examData.list || '[]');
      const qIds = list.map(q => q.questionId);
      const allQuestions = await vocabulaireQuestionsAPI.getAll();
      const filteredQuestions = allQuestions.filter(q => qIds.includes(q.id));
      setQuestions(filteredQuestions);
      setAnswers(Array(filteredQuestions.length).fill(null));
    } catch (err) {
      message.error('Không tìm thấy bài kiểm tra!');
      navigate('/exams');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-center">
          <Spin size="large" className="mb-4" />
          <div className="text-white text-lg font-medium">Đang tải bài kiểm tra...</div>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <Card className="shadow-2xl bg-white/90 backdrop-blur-lg border-0">
          <div className="text-center p-8">
            <BookOutlined className="text-6xl text-gray-400 mb-4" />
            <Text className="text-xl">Không có câu hỏi nào trong bài kiểm tra này.</Text>
          </div>
        </Card>
      </div>
    );
  }

  const list: UserExamListItem[] = JSON.parse(exam.list || '[]');
  const q = questions[current];
  const userAnswer = list[current]?.answer;
  const correctAnswer = q.title_en;
  const otherQuestions = questions.filter(qq => qq.id !== q.id);
  let wrongAnswers = otherQuestions.map(qq => qq.title_en).filter(Boolean);
  wrongAnswers = wrongAnswers.filter(ans => ans !== correctAnswer);
  wrongAnswers = shuffle(wrongAnswers).slice(0, 3);
  const options = optionsState[current] || [];

  const handleSelect = (ans: string) => {
    if (showResult || submitted) return;
    setSelected(ans);
    const isAnsCorrect = ans === correctAnswer;
    setIsCorrect(isAnsCorrect);
    setShowResult(true);
    setFeedback(isAnsCorrect ? getRandom(feedbacks.correct) : getRandom(feedbacks.wrong));
    setAnswers(prev => {
      const newArr = [...prev];
      newArr[current] = ans;
      return newArr;
    });
  };

  const handleNext = () => {
    setCurrent(c => (c + 1 < questions.length ? c + 1 : c));
    setSelected(null);
    setShowResult(false);
    setIsCorrect(null);
    setFeedback('');
  };

  const handlePrev = () => {
    setCurrent(c => (c - 1 >= 0 ? c - 1 : 0));
    setSelected(null);
    setShowResult(false);
    setIsCorrect(null);
    setFeedback('');
  };

  const handleSubmitExam = async () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      const correctAns = q.title_en || q.title_vi;
      if (answers[idx] === correctAns) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    try {
      const list = questions.map((q, idx) => ({
        questionId: q.id,
        answer: answers[idx] || '',
        isCorrect: (answers[idx] === (q.title_en || q.title_vi)),
      }));
      await userExamsAPI.update(Number(id), { list: JSON.stringify(list) });
    } catch {}
  };

  if (submitted) {
    const isExcellent = score === questions.length;
    const isGood = score >= questions.length * 0.7;
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 px-4 py-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-pink-400/20 to-transparent rounded-full animate-pulse"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <Card className="w-full max-w-2xl shadow-2xl bg-white/95 backdrop-blur-xl border-0 relative z-10">
          <div className="text-center p-8">
            {/* Trophy animation for perfect score */}
            {isExcellent && (
              <div className="mb-6">
                <TrophyOutlined className="text-8xl text-yellow-500 animate-bounce" />
                <div className="text-yellow-500 text-lg font-medium mt-2">🌟 HOÀN HẢO! 🌟</div>
              </div>
            )}
            
            {/* Score display with gradient text */}
            <div className="mb-6">
              <div className={`text-6xl font-bold mb-4 bg-gradient-to-r ${
                isExcellent ? 'from-yellow-400 via-orange-500 to-red-500' :
                isGood ? 'from-green-400 to-blue-500' :
                'from-blue-400 to-purple-500'
              } bg-clip-text text-transparent`}>
                {score} / {questions.length}
              </div>
              
              <Title level={2} className={`mb-4 ${
                isExcellent ? 'text-green-600' : 
                isGood ? 'text-blue-600' : 
                'text-orange-600'
              }`}>
                {isExcellent ? '🎉 Xuất sắc! Bạn đã trả lời đúng tất cả!' : 
                 isGood ? `🎊 Tuyệt vời! Bạn đúng ${score} / ${questions.length} câu` :
                 `💪 Bạn đúng ${score} / ${questions.length} câu`}
              </Title>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <Progress 
                percent={Math.round((score / questions.length) * 100)} 
                strokeColor={{
                  '0%': isExcellent ? '#fbbf24' : isGood ? '#10b981' : '#3b82f6',
                  '100%': isExcellent ? '#f59e0b' : isGood ? '#059669' : '#1d4ed8',
                }}
                strokeWidth={12}
                className="mb-4"
              />
            </div>

            {/* Motivational message */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <Text className="text-lg text-gray-700 leading-relaxed">
                {isExcellent ? '✨ Tuyệt vời! Bạn đã thể hiện sự hiểu biết xuất sắc. Hãy tiếp tục phát huy!' : 
                 isGood ? '🌟 Bạn đã làm rất tốt! Hãy xem lại những câu còn thiếu để hoàn thiện kiến thức.' :
                 score === 0 ? '🌱 Đừng nản lòng! Mọi chuyên gia đều bắt đầu từ những bước đầu tiên. Hãy luyện tập thêm nhé!' :
                 '🚀 Bạn đã rất cố gắng! Hãy xem lại đáp án và thử lại để cải thiện kết quả.'}
              </Text>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                type="primary" 
                size="large" 
                onClick={() => navigate('/exams')}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 border-0 hover:from-indigo-600 hover:to-purple-700 shadow-lg px-8 py-3 h-auto text-lg font-medium"
                style={{ borderRadius: '12px' }}
              >
                📚 Về danh sách bài thi
              </Button>
              <Button 
                size="large" 
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-green-500 to-teal-600 text-white border-0 hover:from-green-600 hover:to-teal-700 shadow-lg px-8 py-3 h-auto text-lg font-medium"
                style={{ borderRadius: '12px' }}
              >
                🔄 Làm lại
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 px-4 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-pink-400/10 to-transparent rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-gradient-to-tl from-indigo-400/10 to-transparent rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-gradient-to-br from-purple-400/10 to-transparent rounded-full animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="mb-8 w-full max-w-2xl flex items-center justify-between relative z-10">
        <Button 
          icon={<LeftOutlined />} 
          onClick={() => navigate(-1)} 
          size="large" 
          className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30 shadow-lg"
          style={{ borderRadius: '12px' }}
        >
          Quay lại
        </Button>
        <div className="text-center flex-1">
          <Title level={2} className="text-white font-bold mb-2 drop-shadow-lg">
            🎯 Bài Kiểm Tra
          </Title>
          <div className="text-white/80 text-sm">Hãy chọn đáp án đúng nhất</div>
        </div>
        <div className="w-24"></div>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-2xl shadow-2xl bg-white/95 backdrop-blur-xl border-0 relative z-10" style={{ borderRadius: '24px' }}>
        <div className="p-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {current + 1}
              </div>
              <div>
                <Text className="text-lg font-bold text-indigo-800">Câu {current + 1}</Text>
                <Text className="text-sm text-gray-600 block">trên {questions.length} câu</Text>
              </div>
            </div>
            <div className="text-right">
              <Progress 
                percent={Math.round(((current + 1) / questions.length) * 100)} 
                size="small" 
                strokeColor={{
                  '0%': '#6366f1',
                  '100%': '#8b5cf6',
                }}
                className="w-32 mb-1"
              />
              <Text className="text-sm text-gray-600 hidden">
                {Math.round(((current + 1) / questions.length) * 100)}% hoàn thành
              </Text>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-l-4 border-indigo-500">
            <Title level={3} className="mb-4 text-indigo-900 leading-relaxed">
              📝 {q.title_vi || q.title_en}
            </Title>
            {(q.description_vi || q.description_en) && (
              <Text className="block text-gray-700 text-base leading-relaxed italic">
                💡 {q.description_vi || q.description_en}
              </Text>
            )}
          </div>

          {/* Options */}
          <div className="flex flex-col gap-4 mb-8">
            {options.map((opt, idx) => {
              let className = "transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg";
              let style: React.CSSProperties = {
                border: '2px solid #e5e7eb',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '16px',
                padding: '20px 24px',
                fontSize: '16px',
                fontWeight: 500,
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '16px',
                cursor: showResult ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                height: 'auto',
                minHeight: '70px'
              };
              
              let icon = null;
              
              if (showResult) {
                if (opt === selected && !isCorrect) {
                  style.border = '2px solid #f59e0b';
                  style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
                  style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.25)';
                  icon = <CloseCircleTwoTone twoToneColor="#f59e0b" className="text-2xl" />;
                  className += " animate-pulse";
                }
                if (opt === correctAnswer) {
                  style.border = '2px solid #10b981';
                  style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
                  style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.25)';
                  icon = <CheckCircleTwoTone twoToneColor="#10b981" className="text-2xl" />;
                  className += " animate-bounce";
                }
                if (opt !== selected && opt !== correctAnswer) {
                  style.opacity = 0.5;
                  style.transform = 'scale(0.98)';
                }
              } else {
                style.cursor = 'pointer';
              }
              
              return (
                <Button
                  key={idx}
                  block
                  size="large"
                  style={style}
                  className={className}
                  onClick={() => handleSelect(opt!)}
                  disabled={showResult}
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="flex-1 text-left">{opt}</span>
                    {icon && <div className="flex-shrink-0">{icon}</div>}
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Feedback */}
          {showResult && (
            <div className={`text-center p-6 rounded-2xl mb-8 ${
              isCorrect 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' 
                : 'bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200'
            }`}>
              <div className="text-4xl mb-2">
                {isCorrect ? '🎉' : '💪'}
              </div>
              <Text className={`text-xl font-bold ${
                isCorrect ? 'text-green-700' : 'text-orange-700'
              }`}>
                {feedback}
              </Text>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              icon={<LeftOutlined />}
              onClick={handlePrev}
              size="large"
              disabled={current === 0}
              className="bg-gradient-to-r from-gray-100 to-gray-200 border-0 hover:from-gray-200 hover:to-gray-300 shadow-md disabled:opacity-50"
              style={{ 
                borderRadius: '12px', 
                width: '60px', 
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            
            <div className="flex-1 flex justify-center">
              {current === questions.length - 1 && !submitted && (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmitExam}
                  disabled={answers.some(a => !a)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 border-0 hover:from-green-600 hover:to-emerald-700 shadow-lg px-8 py-3 h-auto text-lg font-medium"
                  style={{ borderRadius: '12px' }}
                >
                  🚀 Nộp bài
                </Button>
              )}
            </div>

            <Button
              icon={<RightOutlined />}
              onClick={handleNext}
              size="large"
              disabled={current === questions.length - 1 || submitted}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 hover:from-indigo-600 hover:to-purple-700 shadow-lg disabled:opacity-50"
              style={{ 
                borderRadius: '12px', 
                width: '60px', 
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExamDetail;