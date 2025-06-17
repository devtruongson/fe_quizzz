import axios from 'axios';
import type { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  Topic, 
  Vocabulaire, 
  VocabulaireQuestion,
  UserVocabulaire,
  UserExam,
  ExamQuestion
} from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<User> => {
    const response = await api.post('/users/login', data);
    return response.data;
  },
  
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post('/users/register', data);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },
  
  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  create: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Topics API
export const topicsAPI = {
  getAll: async (): Promise<Topic[]> => {
    const response = await api.get('/topics');
    return response.data;
  },
  
  getById: async (id: number): Promise<Topic> => {
    const response = await api.get(`/topics/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<Topic>): Promise<Topic> => {
    const response = await api.post('/topics', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<Topic>): Promise<Topic> => {
    const response = await api.put(`/topics/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/topics/${id}`);
  },
};

// Vocabulaires API
export const vocabulairesAPI = {
  getAll: async (): Promise<Vocabulaire[]> => {
    const response = await api.get('/vocabulaires');
    return response.data;
  },
  
  getById: async (id: number): Promise<Vocabulaire> => {
    const response = await api.get(`/vocabulaires/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<Vocabulaire>): Promise<Vocabulaire> => {
    const response = await api.post('/vocabulaires', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<Vocabulaire>): Promise<Vocabulaire> => {
    const response = await api.put(`/vocabulaires/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/vocabulaires/${id}`);
  },
};

// VocabulaireQuestions API
export const vocabulaireQuestionsAPI = {
  getAll: async (): Promise<VocabulaireQuestion[]> => {
    const response = await api.get('/vocabulaire-questions');
    return response.data;
  },
  
  getById: async (id: number): Promise<VocabulaireQuestion> => {
    const response = await api.get(`/vocabulaire-questions/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<VocabulaireQuestion>): Promise<VocabulaireQuestion> => {
    const response = await api.post('/vocabulaire-questions', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<VocabulaireQuestion>): Promise<VocabulaireQuestion> => {
    const response = await api.put(`/vocabulaire-questions/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/vocabulaire-questions/${id}`);
  },
};

// UserVocabulaires API
export const userVocabulairesAPI = {
  getAll: async (): Promise<UserVocabulaire[]> => {
    const response = await api.get('/user-vocabulaires');
    return response.data;
  },
  
  getById: async (id: number): Promise<UserVocabulaire> => {
    const response = await api.get(`/user-vocabulaires/${id}`);
    return response.data;
  },
  
  getByUserId: async (userId: number): Promise<UserVocabulaire[]> => {
    const response = await api.get(`/user-vocabulaires?userId=${userId}`);
    return response.data;
  },
  
  getByUserAndTopic: async (userId: number, topicId: number): Promise<UserVocabulaire[]> => {
    const response = await api.get(`/user-vocabulaires?userId=${userId}&topicId=${topicId}`);
    return response.data;
  },
  
  create: async (data: Partial<UserVocabulaire>): Promise<UserVocabulaire> => {
    const response = await api.post('/user-vocabulaires', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<UserVocabulaire>): Promise<UserVocabulaire> => {
    const response = await api.put(`/user-vocabulaires/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/user-vocabulaires/${id}`);
  },
  
  // Method đặc biệt để lưu tiến độ học theo topic
  saveTopicProgress: async (userId: number, topicId: number, progressData: {
    status: 'start' | 'doing' | 'completed';
    percentComplete: number;
    studiedCards: number[];
  }): Promise<UserVocabulaire> => {
    const response = await api.post('/user-vocabulaires/topic-progress', {
      userId,
      topicId,
      ...progressData
    });
    return response.data;
  },
};

// User Exams API
export const userExamsAPI = {
  getAll: async (): Promise<UserExam[]> => {
    const response = await api.get('/user-exams');
    return response.data;
  },
  
  getById: async (id: number): Promise<UserExam> => {
    const response = await api.get(`/user-exams/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<UserExam>): Promise<UserExam> => {
    const response = await api.post('/user-exams', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<UserExam>): Promise<UserExam> => {
    const response = await api.put(`/user-exams/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/user-exams/${id}`);
  },
};

// Exam Questions API
export const examQuestionsAPI = {
  getAll: async (): Promise<ExamQuestion[]> => {
    const response = await api.get('/exam-questions');
    return response.data;
  },
  
  getById: async (id: number): Promise<ExamQuestion> => {
    const response = await api.get(`/exam-questions/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<ExamQuestion>): Promise<ExamQuestion> => {
    const response = await api.post('/exam-questions', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<ExamQuestion>): Promise<ExamQuestion> => {
    const response = await api.put(`/exam-questions/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/exam-questions/${id}`);
  },
};

export default api; 