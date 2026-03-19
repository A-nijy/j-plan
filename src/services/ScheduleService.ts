import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { Schedule } from '../types';

const DB_NAME = 'jplan.db';

export class ScheduleService {
  private static db: SQLite.SQLiteDatabase | null = null;

  static async getDb() {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
    }
    return this.db;
  }

  static async createSchedule(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>) {
    const db = await this.getDb();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `INSERT INTO schedules (id, title, description, start_time, end_time, color, day_of_week, target_date, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, schedule.title, schedule.description || null, schedule.start_time, schedule.end_time, schedule.color, schedule.day_of_week ?? null, schedule.target_date || null, now, now]
    );
    return id;
  }

  static async getSchedulesForDate(date: string) {
    const db = await this.getDb();
    const dayOfWeek = new Date(date).getDay();
    
    // Get recurring schedules for the day of week OR specific schedules for the date
    const result = await db.getAllAsync<Schedule>(
      `SELECT * FROM schedules 
       WHERE is_deleted = 0 
       AND (day_of_week = ? OR target_date = ?)
       ORDER BY start_time ASC`,
      [dayOfWeek, date]
    );
    return result;
  }

  static async deleteSchedule(id: string) {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE schedules SET is_deleted = 1, updated_at = ? WHERE id = ?',
      [now, id]
    );
  }
}
