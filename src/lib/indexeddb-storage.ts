import {Question, AnswerRecord, Statistics} from '@/types/question';
import {db, AnswerTable} from './database';
import {defaultQuestions} from './default-questions';

// 全局缓存变量，用于同步访问数据
let questionsCache: Question[] = [];  // 题目缓存
let answersCache: AnswerRecord[] = []; // 答题记录缓存
let isInitialized = false;            // 初始化状态标记

/**
 * IndexedDB 存储服务类
 * 提供基于 Dexie.js 的本地数据存储功能
 *
 * 特性：
 * 1. 混合同步/异步 API，兼容现有代码
 * 2. 内存缓存提升性能
 * 3. 自动数据初始化
 */

export class IndexedDBStorage {

  /**
   * 确保数据库已初始化
   * 仅在首次调用时执行初始化和缓存加载
   */
  private async ensureInitialized(): Promise<void> {
    if (!isInitialized) {
      await this.initializeDefaultData();  // 初始化默认数据
      await this.loadCache();              // 加载缓存
      isInitialized = true;
    }
  }

  /**
   * 初始化默认题目数据
   * 只在数据库为空时执行
   */
  private async initializeDefaultData(): Promise<void> {
    const count = await db.questions.count();
    if (count === 0) {
      await db.questions.bulkAdd(defaultQuestions);
      console.log('初始化默认题目数据完成');
    }
  }

  /**
   * 从 IndexedDB 加载数据到内存缓存
   * 提升后续访问性能
   */
  private async loadCache(): Promise<void> {
    questionsCache = await db.questions.toArray();

    // 将 AnswerTable 转换为 AnswerRecord，处理 ID 类型差异
    const answersFromDB = await db.answers.orderBy('timestamp').reverse().toArray();
    answersCache = answersFromDB.map(answer => ({
      ...answer,
      id: answer.id?.toString() || ''  // 将 number ID 转换为 string
    }));
  }

  /**
   * 获取所有题目（异步版本）
   * @returns Promise<Question[]> 题目数组
   */
  async getQuestions(): Promise<Question[]> {
    await this.ensureInitialized();
    return questionsCache;
  }


  /**
   * 保存题目列表
   * 同时更新数据库和缓存
   * @param questions 题目数组
   */
  async saveQuestions(questions: Question[]): Promise<void> {
    await this.ensureInitialized();
    await db.questions.clear();                    // 清空现有数据
    await db.questions.bulkAdd(questions);         // 批量插入新数据
    questionsCache = questions;                    // 更新缓存
  }

  /**
   * 根据 ID 获取单个题目
   * @param id 题目 ID
   * @returns Promise<Question | undefined>
   */
  async getQuestionById(id: string): Promise<Question | undefined> {
    await this.ensureInitialized();
    return questionsCache.find(q => q.id === id);
  }

  async getAnswers(): Promise<AnswerRecord[]> {
    await this.ensureInitialized();
    return answersCache;
  }


  async saveAnswer(answer: AnswerRecord): Promise<void> {
    await this.ensureInitialized();
    // 转换 AnswerRecord 到 AnswerTable，移除原有的 id 字段让 IndexedDB 自动生成
    const {id, ...answerData} = answer;
    const newId = await db.answers.add(answerData as AnswerTable);

    // 创建带有新 ID 的 AnswerRecord 并添加到缓存
    const answerWithNewId: AnswerRecord = {
      ...answer,
      id: newId.toString()
    };
    answersCache.unshift(answerWithNewId);
  }


  async clearAnswers(): Promise<void> {
    await this.ensureInitialized();
    await db.answers.clear();
    answersCache = [];
  }

  async resetAll(): Promise<void> {
    await db.questions.clear();
    await db.answers.clear();
    questionsCache = [];
    answersCache = [];
    isInitialized = false;
    console.log('所有数据已清除');
  }

  /**
   * 获取统计信息
   * 基于缓存数据实时计算，符合 Statistics 接口规范
   */
  async getStatistics(): Promise<Statistics> {
    await this.ensureInitialized();

    const categoryStats: Statistics['categoryStats'] = {
      'algorithm': {total: 0, correct: 0, attempted: 0},
      'data-structure': {total: 0, correct: 0, attempted: 0},
      'system-design': {total: 0, correct: 0, attempted: 0},
      'database': {total: 0, correct: 0, attempted: 0},
      'web': {total: 0, correct: 0, attempted: 0},
      'other': {total: 0, correct: 0, attempted: 0}
    };

    // 统计每个分类的题目总数
    questionsCache.forEach(q => {
      categoryStats[q.category].total++;
    });

    // 统计答题情况
    const attemptedQuestionIds = new Set<string>();
    let correctAnswers = 0;

    answersCache.forEach(answer => {
      attemptedQuestionIds.add(answer.questionId);

      const question = questionsCache.find(q => q.id === answer.questionId);
      if (question) {
        categoryStats[question.category].attempted++;
        if (answer.isCorrect) {
          correctAnswers++;
          categoryStats[question.category].correct++;
        }
      }
    });

    const attemptedQuestions = attemptedQuestionIds.size;
    const wrongAnswers = answersCache.length - correctAnswers;
    const accuracy = answersCache.length > 0 ? (correctAnswers / answersCache.length) * 100 : 0;

    return {
      totalQuestions: questionsCache.length,
      attemptedQuestions,
      correctAnswers,
      wrongAnswers,
      accuracy,
      categoryStats
    };
  }

  /**
   * 获取错题列表
   * 基于缓存数据直接筛选
   */
  async getWrongQuestions(): Promise<Question[]> {
    await this.ensureInitialized();

    const wrongQuestionIds = new Set(
      answersCache.filter(a => !a.isCorrect).map(a => a.questionId)
    );

    return questionsCache.filter(q => wrongQuestionIds.has(q.id));
  }

  /**
   * 获取题目状态映射（私有方法）
   * 返回每个题目的最新答题状态
   */
  private async getQuestionStatusMap(): Promise<Map<string, { isAttempted: boolean; isCorrect?: boolean }>> {
    const statusMap = new Map<string, { isAttempted: boolean; isCorrect?: boolean }>();

    answersCache.forEach(answer => {
      const current = statusMap.get(answer.questionId);
      // 如果还没有记录，或者当前记录是错误的但这次是正确的，则更新
      if (!current || (!current.isCorrect && answer.isCorrect)) {
        statusMap.set(answer.questionId, {
          isAttempted: true,
          isCorrect: answer.isCorrect
        });
      }
    });

    return statusMap;
  }

  /**
   * 获取带状态的题目列表
   * 包含答题状态信息
   */
  async getQuestionsWithStatus(): Promise<Array<Question & { isAttempted: boolean; isCorrect?: boolean }>> {
    await this.ensureInitialized();

    const statusMap = await this.getQuestionStatusMap();

    return questionsCache.map(question => ({
      ...question,
      isAttempted: statusMap.has(question.id),
      isCorrect: statusMap.get(question.id)?.isCorrect
    }));
  }

}

// 创建存储服务实例
export const indexedDBStorage = new IndexedDBStorage();

/**
 * 对外提供的统一存储 API
 * 兼容原有的同步调用方式，同时提供新的异步能力
 */

export const storage = {
  // 异步 API - 推荐使用
  getQuestions: () => indexedDBStorage.getQuestions(),
  saveQuestions: (questions: Question[]) => indexedDBStorage.saveQuestions(questions),
  getAnswers: () => indexedDBStorage.getAnswers(),
  saveAnswer: (answer: AnswerRecord) => indexedDBStorage.saveAnswer(answer),
  clearAnswers: () => indexedDBStorage.clearAnswers(),
  resetAll: () => indexedDBStorage.resetAll(),

  getQuestionById: (id: string) => indexedDBStorage.getQuestionById(id),
  getStatistics: () => indexedDBStorage.getStatistics(),
  getWrongQuestions: () => indexedDBStorage.getWrongQuestions(),
  getQuestionsWithStatus: () => indexedDBStorage.getQuestionsWithStatus(),
};