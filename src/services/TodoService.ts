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
    const today = now.split('T')[0];
    
    // Get current max order
    const maxOrderRes = await db.getFirstAsync<{ max_order: number }>(
      'SELECT MAX(item_order) as max_order FROM todos WHERE type = ?',
      [todo.type]
    );
    const nextOrder = (maxOrderRes?.max_order || 0) + 1;

    await db.runAsync(
      `INSERT INTO todos (id, content, is_completed, type, target_date, habit_days, item_order, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, todo.content, todo.is_completed, todo.type, todo.target_date || null, todo.habit_days || null, nextOrder, now, now]
    );

    // Initial content history
    await db.runAsync(
      `INSERT INTO todo_content_history (id, todo_id, content, start_date, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [Crypto.randomUUID(), id, todo.content, today, now]
    );

    return id;
  }

  static async getTodos(type: 'habit' | 'daily', date: string) {
    const db = await this.getDb();
    
    if (type === 'habit') {
      // Habits: Show all active habits and their completion status for the specific date
      // AND filter by creation date
      const habits = await db.getAllAsync<any>(
        `SELECT t.*, COALESCE(tc.status, 0) as is_completed 
         FROM todos t 
         LEFT JOIN todo_completions tc ON t.id = tc.todo_id AND tc.completed_date = ?
         WHERE t.type = 'habit' 
         AND t.is_deleted = 0
         AND (DATE(t.created_at) <= DATE(?))
         ORDER BY t.item_order ASC`,
        [date, date]
      );

      // Map content from history for each habit
      const mappedHabits = await Promise.all(habits.map(async h => {
        const history = await db.getFirstAsync<{ content: string }>(
          `SELECT content FROM todo_content_history 
           WHERE todo_id = ? AND start_date <= ? 
           ORDER BY start_date DESC LIMIT 1`,
          [h.id, date]
        );
        
        const streak = await this.getStreak(h.id, date);
        
        return {
          ...h,
          content: history?.content || h.content,
          streak: streak
        };
      }));

      return mappedHabits;
    } else {
      // Daily: Show items for the specific date and their completion status
      return await db.getAllAsync<Todo>(
        `SELECT t.*, COALESCE(tc.status, 0) as is_completed 
         FROM todos t 
         LEFT JOIN todo_completions tc ON t.id = tc.todo_id AND tc.completed_date = ?
         WHERE t.type = 'daily' AND t.target_date = ? AND t.is_deleted = 0
         ORDER BY t.item_order ASC`,
        [date, date]
      );
    }
  }

  static async getStreak(todoId: string, date: string): Promise<number> {
    const db = await this.getDb();
    
    // Get completions before or on the given date, ordered by date
    const completions = await db.getAllAsync<{ completed_date: string, status: number }>(
      `SELECT completed_date, status FROM todo_completions 
       WHERE todo_id = ? AND completed_date <= ?
       ORDER BY completed_date DESC`,
      [todoId, date]
    );

    if (completions.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date(date);
    
    // Check today first if it's the date passed
    const todayStatus = completions.find(c => c.completed_date === date);
    if (todayStatus && todayStatus.status === 1) {
      streak++;
    } else if (todayStatus && todayStatus.status === 0) {
      // If today is tracked but not done, streak might be broken or just not started yet for today
      // But typically we look at yesterday
    }

    // Check backwards from yesterday
    let checkDate = new Date(date);
    checkDate.setDate(checkDate.getDate() - 1);

    for (let i = 0; i < completions.length; i++) {
      const compDateStr = checkDate.toISOString().split('T')[0];
      const comp = completions.find(c => c.completed_date === compDateStr);
      
      if (comp && comp.status === 1) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Streak broken
        break;
      }
    }

    return streak;
  }

  static async getHabitHistory(todoId: string) {
    const db = await this.getDb();
    
    const completions = await db.getAllAsync<{ completed_date: string, status: number }>(
      'SELECT completed_date, status FROM todo_completions WHERE todo_id = ? AND status = 1',
      [todoId]
    );
    
    const contentHistory = await db.getAllAsync<{ content: string, start_date: string }>(
      'SELECT content, start_date FROM todo_content_history WHERE todo_id = ? ORDER BY start_date ASC',
      [todoId]
    );

    return {
      completions: completions.map(c => c.completed_date),
      contentHistory: contentHistory
    };
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

  static async updateTodo(id: string, content: string, date: string = new Date().toISOString().split('T')[0]) {
    const db = await this.getDb();
    const now = new Date().toISOString();
    
    // Check if this todo has ANY history yet. 
    // If not, we MUST save the CURRENT content as the "original" history starting from its creation date.
    const hasHistory = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM todo_content_history WHERE todo_id = ? LIMIT 1',
      [id]
    );

    if (!hasHistory) {
      const todo = await db.getFirstAsync<{ content: string, created_at: string }>(
        'SELECT content, created_at FROM todos WHERE id = ?',
        [id]
      );
      if (todo) {
        const originalStartDate = todo.created_at.split(' ')[0];
        await db.runAsync(
          `INSERT INTO todo_content_history (id, todo_id, content, start_date, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [`init_${id}`, id, todo.content, originalStartDate, todo.created_at]
        );
      }
    }

    // Insert into content history for versioning
    // If there's already an entry for this exact start_date, update it instead of creating new
    const existingAtDate = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM todo_content_history WHERE todo_id = ? AND start_date = ?',
      [id, date]
    );

    if (existingAtDate) {
      await db.runAsync(
        'UPDATE todo_content_history SET content = ? WHERE id = ?',
        [content, existingAtDate.id]
      );
    } else {
      await db.runAsync(
        `INSERT INTO todo_content_history (id, todo_id, content, start_date, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [Crypto.randomUUID(), id, content, date, now]
      );
    }

    // Also update the main table (as the "current" content)
    await db.runAsync(
      'UPDATE todos SET content = ?, updated_at = ? WHERE id = ?',
      [content, now, id]
    );
  }

  static async updateTodoOrder(orderedIds: string[]) {
    const db = await this.getDb();
    await db.withTransactionAsync(async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.runAsync(
          'UPDATE todos SET item_order = ? WHERE id = ?',
          [i, orderedIds[i]]
        );
      }
    });
  }
}
