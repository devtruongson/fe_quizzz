// User types
export interface User {
  id: number;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

// Topic types
export interface Topic {
  id: number;
  title: string;
  description?: string;
}

// Vocabulaire types
export interface Vocabulaire {
  id: number;
  topicId: number;
  topic?: Topic;
}

// VocabulaireQuestion types
export interface VocabulaireQuestion {
  id: number;
  audio_vi?: string;
  audio_en?: string;
  image?: string;
  title_vi?: string;
  title_en?: string;
  description_vi?: string;
  description_en?: string;
  vocabulaireId: number;
  vocabulaire?: Vocabulaire;
}

// UserVocabulaire types
export interface UserVocabulaire {
  id: number;
  userId: number;
  vocabulaireId: number;
  status: 'start' | 'doing' | 'completed';
  percentComplete: number;
  vocabulaireQuestionListId: string;
  user?: User;
  vocabulaire?: Vocabulaire;
}

// UserExam types
export interface UserExamListItem {
  questionId: number;
  answer: string;
  isCorrect: boolean;
}

export interface UserExam {
  id: number;
  userId: number;
  list: string; // JSON string of UserExamListItem[]
  user?: User;
}

// ExamQuestion types
export interface ExamQuestion {
  id: number;
  vocabulaireQuestionId: number;
  answer: string;
  isCorrect: boolean;
  vocabulaireQuestion?: VocabulaireQuestion;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
} 