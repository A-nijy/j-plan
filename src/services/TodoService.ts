import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { Todo } from '../types';
import { getDb } from './database';

export class TodoService {
  static async getDb() {
    return await getDb();
  }

  static async createTodo(todo: Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>) {
    const db = await this.getDb();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `INSERT INTO todos (id, content, is_completed, type, target_date, habit_days, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, todo.content, todo.is_completed, todo.type, todo.target_date || null, todo.habit_days || null, now, now]
    );
    return id;
  }

  static async getTodos(type: 'habit' | 'daily', date?: string) {
    const db = await this.getDb();
    
    if (type === 'habit') {
      return await db.getAllAsync<Todo>(
        'SELECT * FROM todos WHERE type = ? AND is_deleted = 0',
        ['habit']
      );
    } else {
      return await db.getAllAsync<Todo>(
        'SELECT * FROM todos WHERE type = ? AND target_date = ? AND is_deleted = 0',
        ['daily', date || '']
      );
    }
  }

  static async toggleTodo(id: string, isCompleted: boolean) {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE todos SET is_completed = ?, updated_at = ? WHERE id = ?',
      [isCompleted ? 1 : 0, now, id]
    );
  }

  static async deleteTodo(id: string) {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE todos SET is_deleted = 1, updated_at = ? WHERE id = ?',
      [now, id]
    );
  }
}
