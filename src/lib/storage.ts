import { Question, AnswerRecord } from '@/types/question';

const QUESTIONS_KEY = 'codequiz_questions';
const ANSWERS_KEY = 'codequiz_answers';

export const storage = {
  // Questions
  getQuestions: (): Question[] => {
    const data = localStorage.getItem(QUESTIONS_KEY);
    return data ? JSON.parse(data) : getDefaultQuestions();
  },

  saveQuestions: (questions: Question[]): void => {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
  },

  // Answers
  getAnswers: (): AnswerRecord[] => {
    const data = localStorage.getItem(ANSWERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveAnswer: (answer: AnswerRecord): void => {
    const answers = storage.getAnswers();
    answers.push(answer);
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
  },

  clearAnswers: (): void => {
    localStorage.removeItem(ANSWERS_KEY);
  },

  resetAll: (): void => {
    localStorage.removeItem(ANSWERS_KEY);
    localStorage.removeItem(QUESTIONS_KEY);
  }
};

function getDefaultQuestions(): Question[] {
  return [
    {
      id: '1',
      title: '时间复杂度基础',
      category: 'algorithm',
      difficulty: 'easy',
      type: 'single',
      content: '以下哪个算法的时间复杂度是 O(log n)？',
      options: ['线性搜索', '二分搜索', '冒泡排序', '选择排序'],
      correctAnswer: '二分搜索',
      explanation: '二分搜索每次将搜索范围减半，因此时间复杂度为 O(log n)。',
      tags: ['时间复杂度', '搜索']
    },
    {
      id: '2',
      title: '数组操作',
      category: 'data-structure',
      difficulty: 'easy',
      type: 'single',
      content: '在 JavaScript 中，以下哪个方法会改变原数组？',
      options: ['map()', 'filter()', 'push()', 'slice()'],
      correctAnswer: 'push()',
      explanation: 'push() 方法会直接修改原数组，而 map()、filter() 和 slice() 都会返回新数组。',
      tags: ['JavaScript', '数组']
    },
    {
      id: '3',
      title: '快速排序',
      category: 'algorithm',
      difficulty: 'medium',
      type: 'single',
      content: '快速排序的平均时间复杂度是多少？',
      options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
      correctAnswer: 'O(n log n)',
      explanation: '快速排序的平均时间复杂度为 O(n log n)，但在最坏情况下会退化到 O(n²)。',
      tags: ['排序', '时间复杂度']
    },
    {
      id: '4',
      title: 'React Hooks',
      category: 'web',
      difficulty: 'medium',
      type: 'multiple',
      content: '以下哪些是 React 内置的 Hooks？（多选）',
      options: ['useState', 'useEffect', 'useQuery', 'useMemo', 'useRouter'],
      correctAnswer: ['useState', 'useEffect', 'useMemo'],
      explanation: 'useState、useEffect 和 useMemo 是 React 内置的 Hooks。useQuery 来自 React Query，useRouter 来自 Next.js。',
      tags: ['React', 'Hooks']
    },
    {
      id: '5',
      title: '数据库索引',
      category: 'database',
      difficulty: 'hard',
      type: 'single',
      content: 'B+ 树相比 B 树的主要优势是什么？',
      options: [
        '更少的节点数',
        '所有数据都在叶子节点，利于范围查询',
        '插入操作更快',
        '占用更少的内存'
      ],
      correctAnswer: '所有数据都在叶子节点，利于范围查询',
      explanation: 'B+ 树的所有数据都存储在叶子节点，并且叶子节点之间有指针连接，这使得范围查询非常高效。',
      tags: ['数据库', '索引', 'B+树']
    }
  ];
}
