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

  static async getTodos(type: 'habit' | 'daily', date: string) {
    const db = await this.getDb();
    
    if (type === 'habit') {
      // Habits: Show all active habits and their completion status for the specific date
      // AND filter by creation date
      return await db.getAllAsync<Todo>(
        `SELECT t.*, COALESCE(tc.status, 0) as is_completed 
         FROM todos t 
         LEFT JOIN todo_completions tc ON t.id = tc.todo_id AND tc.completed_date = ?
         WHERE t.type = 'habit' 
         AND t.is_deleted = 0
         AND (DATE(t.created_at) <= DATE(?))`,
        [date, date]
      );
    } else {
      // Daily: Show items for the specific date and their completion status
      return await db.getAllAsync<Todo>(
        `SELECT t.*, COALESCE(tc.status, 0) as is_completed 
         FROM todos t 
         LEFT JOIN todo_completions tc ON t.id = tc.todo_id AND tc.completed_date = ?
         WHERE t.type = 'daily' AND t.target_date = ? AND t.is_deleted = 0`,
        [date, date]
      );
    }
  }

  static async toggleTodo(id: string, date: string, isCompleted: boolean) {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const completionId = Crypto.randomUUID();
    
    // Use INSERT OR REPLACE to handle daily status uniquely for (todo_id, completed_date)
    await db.runAsync(
      `INSERT INTO todo_completions (id, todo_id, completed_date, status, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(todo_id, completed_date) DO UPDATE SET 
       status = excluded.status,
       updated_at = excluded.updated_at`,
      [completionId, id, date, isCompleted ? 1 : 0, now]
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
