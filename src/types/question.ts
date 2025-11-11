export type QuestionType = 'single' | 'multiple' | 'blank' | 'essay';

export type QuestionCategory = 'algorithm' | 'data-structure' | 'system-design' | 'database' | 'web' | 'other';

export interface Question {
  id: string;
  title: string;
  category: QuestionCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  type: QuestionType;
  content: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  tags?: string[];
}

export interface AnswerRecord {
  id: string;
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  timestamp: number;
}

export interface Statistics {
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  categoryStats: Record<QuestionCategory, {
    total: number;
    correct: number;
    attempted: number;
  }>;
}
