import React, { useEffect, useState } from 'react';
import { Card, Button, Radio, Typography, Progress, message, Result } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { vocabulaireQuestionsAPI, userExamsAPI } from '../services/api';
import type { VocabulaireQuestion, UserExamListItem } from '../types';

const { Title, Text } = Typography;

interface QuizQuestion {
  id: number;
  title_vi?: string;
  title_en?: string;
  options: string[];
  correct: string;
}

const Quiz: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const data = await vocabulaireQuestionsAPI.getAll();
      // Giả sử mỗi câu hỏi có title_vi, title_en, và đáp án đúng là title_en
      // Sinh 4 đáp án ngẫu nhiên (1 đúng, 3 sai)
      const allTitles = data.map((q: VocabulaireQuestion) => q.title_en).filter(Boolean) as string[];
      const quizQs: QuizQuestion[] = data.slice(0, 10).map((q: VocabulaireQuestion) => {
        const correct = q.title_en || '';
        // Sinh 3 đáp án sai
        const wrongs = allTitles.filter(t => t !== correct);
        const options = [correct, ...shuffle(wrongs).slice(0, 3)];
        return {
          id: q.id,
          title_vi: q.title_vi,
          title_en: q.title_en,
          options: shuffle(options),
          correct,
        };
      });
      setQuestions(quizQs);
    } catch (error) {
      message.error('Lỗi khi tải câu hỏi');
    }
  };

  function shuffle<T>(arr: T[]): T[] {
    return arr.slice().sort(() => Math.random() - 0.5);
  }

  const handleAnswer = (qid: number, value: string) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  };

  const handleNext = () => {
    setCurrent(c => c + 1);
  };

  const handlePrev = () => {
    setCurrent(c => c - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const list: UserExamListItem[] = questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id] || '',
        isCorrect: (answers[q.id] || '') === q.correct,
      }));
      const correct = list.filter(q => q.isCorrect).length;
      await userExamsAPI.create({
        userId: user?.id,
        list: JSON.stringify(list),
      });
      setResult({ score: correct, total: list.length });
      message.success('Nộp bài thành công!');
    } catch (error) {
      message.error('Lỗi khi nộp bài');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <Result
        status="success"
        title={`Bạn đã hoàn thành bài thi!`}
        subTitle={`Số câu đúng: ${result.score} / ${result.total}`}
        extra={[
          <Button type="primary" onClick={() => window.location.reload()} key="again">
            Làm lại bài thi
          </Button>,
        ]}
      />
    );
  }

  if (!questions.length) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải câu hỏi...</div>;
  }

  const q = questions[current];
  const percent = Math.round(((current + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-xl">
        <div className="mb-4">
          <Progress percent={percent} showInfo={false} />
        </div>
        <Title level={4} className="mb-2">Câu {current + 1} / {questions.length}</Title>
        <Text strong className="block mb-4">{q.title_vi}</Text>
        <Radio.Group
          value={answers[q.id]}
          onChange={e => handleAnswer(q.id, e.target.value)}
          className="flex flex-col gap-2"
        >
          {q.options.map(opt => (
            <Radio key={opt} value={opt} className="rounded-lg px-3 py-2 border">
              {opt}
            </Radio>
          ))}
        </Radio.Group>
        <div className="flex justify-between mt-6">
          <Button onClick={handlePrev} disabled={current === 0}>
            Quay lại
          </Button>
          {current < questions.length - 1 ? (
            <Button type="primary" onClick={handleNext} disabled={!answers[q.id]}>
              Tiếp theo
            </Button>
          ) : (
            <Button type="primary" loading={submitting} onClick={handleSubmit} disabled={!answers[q.id]}>
              Nộp bài
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Quiz; 