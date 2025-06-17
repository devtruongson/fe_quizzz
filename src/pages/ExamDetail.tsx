import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Progress, message, Spin } from 'antd';
import { LeftOutlined, RightOutlined, CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
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

  useEffect(() => {
    fetchExam();
    // eslint-disable-next-line
  }, [id]);

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
    return <div className="min-h-screen flex items-center justify-center"><Spin size="large" /></div>;
  }

  if (!questions.length) {
    return <div className="min-h-screen flex items-center justify-center">Không có câu hỏi nào trong bài kiểm tra này.</div>;
  }

  const list: UserExamListItem[] = JSON.parse(exam.list || '[]');
  const q = questions[current];
  const userAnswer = list[current]?.answer;
  const correctAnswer = q.title_en || q.title_vi;
  const options = [q.title_en, q.title_vi, q.description_en, q.description_vi].filter(Boolean).slice(0, 4);

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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-2 py-8">
        <Card className="w-full max-w-xl shadow-2xl rounded-2xl p-8 text-center">
          <Title level={2} style={{ color: score === questions.length ? '#10b981' : '#f59e0b' }}>
            {score === questions.length ? '🎉 Xuất sắc! Bạn đã trả lời đúng tất cả!' : `Bạn đúng ${score} / ${questions.length} câu`}
          </Title>
          <Text style={{ fontSize: 18, color: '#64748b' }}>
            {score === questions.length ? 'Tuyệt vời! Hãy tiếp tục phát huy.' : score === 0 ? 'Đừng nản, hãy luyện tập thêm nhé!' : 'Bạn đã rất cố gắng, hãy xem lại đáp án và thử lại.'}
          </Text>
          <div className="flex gap-4 justify-center mt-8">
            <Button type="primary" size="large" onClick={() => navigate('/exams')}>Về danh sách bài thi</Button>
            <Button size="large" onClick={() => window.location.reload()}>Làm lại</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-2 py-8">
      <div className="mb-6 w-full max-w-xl flex items-center justify-between">
        <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} size="large" type="text">
          Quay lại
        </Button>
        <Title level={3} className="text-center flex-1 text-indigo-700 font-bold">Bài kiểm tra</Title>
        <span className="w-24" />
      </div>
      <Card className="w-full max-w-xl shadow-2xl rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-indigo-700">Câu {current + 1} / {questions.length}</Text>
          <Progress percent={Math.round(((current + 1) / questions.length) * 100)} size="small" style={{ width: 120 }} />
        </div>
        <div className="mb-6">
          <Title level={4} className="mb-2 text-indigo-800">{q.title_vi || q.title_en}</Title>
          <Text className="block text-gray-600 mb-2">{q.description_vi || q.description_en}</Text>
        </div>
        <div className="flex flex-col gap-4">
          {options.map((opt, idx) => {
            let border = '1px solid #e5e7eb';
            let bg = '#fff';
            let icon = null;
            if (showResult) {
              if (opt === selected && !isCorrect) {
                border = '2px solid #f59e0b';
                bg = '#fff7ed';
                icon = <CloseCircleTwoTone twoToneColor="#f59e0b" />;
              }
              if (opt === correctAnswer) {
                border = '2px solid #10b981';
                bg = '#f0fdf4';
                icon = <CheckCircleTwoTone twoToneColor="#10b981" />;
              }
            }
            return (
              <Button
                key={idx}
                block
                size="large"
                style={{
                  border,
                  background: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  fontWeight: 500,
                  fontSize: 18,
                  gap: 12,
                  color: '#222',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  padding: '18px 20px',
                  borderRadius: 12,
                  transition: 'all 0.2s',
                  cursor: showResult ? 'not-allowed' : 'pointer',
                  opacity: showResult && opt !== selected && opt !== correctAnswer ? 0.7 : 1
                }}
                onClick={() => handleSelect(opt!)}
                disabled={showResult}
              >
                {icon} {opt}
              </Button>
            );
          })}
        </div>
        {showResult && (
          <div className="mt-6 text-center">
            <Text style={{ fontSize: 18, fontWeight: 600, color: isCorrect ? '#10b981' : '#f59e0b' }}>
              {feedback}
            </Text>
          </div>
        )}
        <div className="flex items-center justify-between mt-8 gap-4">
          <Button
            icon={<LeftOutlined />}
            onClick={handlePrev}
            size="large"
            shape="circle"
            disabled={current === 0}
            className="bg-white shadow hover:bg-indigo-100"
          />
          <Button
            icon={<RightOutlined />}
            onClick={handleNext}
            size="large"
            shape="circle"
            disabled={current === questions.length - 1 || submitted}
            className="bg-white shadow hover:bg-indigo-100"
          />
        </div>
        {current === questions.length - 1 && !submitted && (
          <Button
            type="primary"
            size="large"
            className="ml-4"
            onClick={handleSubmitExam}
            disabled={answers.some(a => !a)}
          >
            Nộp bài
          </Button>
        )}
      </Card>
    </div>
  );
};

export default ExamDetail; 