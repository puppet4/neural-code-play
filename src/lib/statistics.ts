import { Question, AnswerRecord, Statistics, QuestionCategory } from '@/types/question';

export function calculateStatistics(
  questions: Question[],
  answers: AnswerRecord[]
): Statistics {
  const categoryStats: Statistics['categoryStats'] = {
    'algorithm': { total: 0, correct: 0, attempted: 0 },
    'data-structure': { total: 0, correct: 0, attempted: 0 },
    'system-design': { total: 0, correct: 0, attempted: 0 },
    'database': { total: 0, correct: 0, attempted: 0 },
    'web': { total: 0, correct: 0, attempted: 0 },
    'other': { total: 0, correct: 0, attempted: 0 }
  };

  // Count total questions per category
  questions.forEach(q => {
    categoryStats[q.category].total++;
  });

  // Count attempted and correct answers
  const attemptedQuestionIds = new Set<string>();
  let correctAnswers = 0;

  answers.forEach(answer => {
    attemptedQuestionIds.add(answer.questionId);
    
    const question = questions.find(q => q.id === answer.questionId);
    if (question) {
      categoryStats[question.category].attempted++;
      if (answer.isCorrect) {
        correctAnswers++;
        categoryStats[question.category].correct++;
      }
    }
  });

  const attemptedQuestions = attemptedQuestionIds.size;
  const wrongAnswers = answers.length - correctAnswers;
  const accuracy = answers.length > 0 ? (correctAnswers / answers.length) * 100 : 0;

  return {
    totalQuestions: questions.length,
    attemptedQuestions,
    correctAnswers,
    wrongAnswers,
    accuracy,
    categoryStats
  };
}

export function getWrongQuestions(
  questions: Question[],
  answers: AnswerRecord[]
): Question[] {
  const wrongQuestionIds = new Set(
    answers.filter(a => !a.isCorrect).map(a => a.questionId)
  );
  
  return questions.filter(q => wrongQuestionIds.has(q.id));
}
