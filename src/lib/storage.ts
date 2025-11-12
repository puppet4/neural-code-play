/**
 * 存储服务统一入口
 *
 * 这个文件作为存储服务的统一入口，方便未来切换不同的存储后端：
 * - 当前使用：IndexedDB (通过 Dexie.js)
 * - 计划支持：MongoDB (用于多端同步)
 *
 * 通过这种抽象层设计，组件代码无需修改即可在不同存储方案间切换
 */

import {storage as indexedDBStorageService} from './indexeddb-storage';

// 导出 IndexedDB 存储服务作为默认存储
export const storage = indexedDBStorageService;
