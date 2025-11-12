import Dexie, { Table } from 'dexie';
import { Question, AnswerRecord } from '@/types/question';

/**
 * 答题记录表结构定义
 * 为了适配 IndexedDB 的自增主键，我们重新定义 id 字段
 */
export interface AnswerTable extends Omit<AnswerRecord, 'id'> {
  id?: number; // IndexedDB 自增主键
}

/**
 * 代码练习数据库类
 * 使用 Dexie.js 封装 IndexedDB 操作
 */
export class CodeQuizDatabase extends Dexie {
  // 题目表：存储所有练习题目
  questions!: Table<Question>;
  // 答题记录表：存储用户的答题历史
  answers!: Table<AnswerTable>;

  constructor() {
    super('CodeQuizDB');

    // 数据库版本 1 的表结构定义
    this.version(1).stores({
      // questions 表：以 id 为主键，支持按 title、category、difficulty、type 查询，tags 为多值索引
      questions: 'id, title, category, difficulty, type, *tags',
      // answers 表：id 自增主键，支持按 questionId、isCorrect、timestamp 查询
      answers: '++id, questionId, isCorrect, timestamp'
    });
  }
}

// 创建数据库实例
export const db = new CodeQuizDatabase();