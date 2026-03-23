import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { Schedule } from '../types';
import { getDb } from './database';
import { RoutineService } from './RoutineService';

export class ScheduleService {
  static async getDb() {
    const db = await getDb();
    if (!db) throw new Error('Database not initialized');
    return db;
  }

  static async createSchedule(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'is_routine'>) {
    try {
      const db = await this.getDb();
      const id = Crypto.randomUUID();
      const now = new Date().toISOString();
      
      await db.runAsync(
        `INSERT INTO schedules (id, title, description, start_time, end_time, color, day_of_week, target_date, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, schedule.title, schedule.description || null, schedule.start_time, schedule.end_time, schedule.color, schedule.day_of_week ?? null, schedule.target_date || null, now, now]
      );
      return id;
    } catch (error) {
      console.error('Database INSERT error:', error);
      throw error;
    }
  }

  static async getSchedulesForDate(date: string) {
    const db = await this.getDb();
    const dayOfWeek = (new Date(date).getDay());
    
    // 1. Get specific (single) schedules for this date
    const singleSchedules = await db.getAllAsync<Schedule>(
      `SELECT * FROM schedules 
       WHERE is_deleted = 0 
       AND target_date = ?
       ORDER BY start_time ASC`,
      [date]
    );

    // 2. Get routine templates for this day of week
    const routineTemplates = await RoutineService.getAppliedTemplatesForDay(dayOfWeek);
    
    // Convert templates to schedule-like objects
    const routineSchedules = routineTemplates.map(t => ({
      ...t,
      id: `routine-${t.id}-${date}`,
      target_date: date,
      is_routine: true,
      updated_at: t.created_at,
      is_deleted: 0
    }));

    // Merge and sort: Put routines first so they render behind regular schedules
    const merged = [...singleSchedules, ...routineSchedules].sort((a, b) => {
      // 1. Routine first (is_routine: true comes before false)
      if (!!a.is_routine !== !!b.is_routine) {
        return a.is_routine ? -1 : 1;
      }
      // 2. Then by start time
      return a.start_time.localeCompare(b.start_time);
    });

    return merged;
  }

  static async checkOverlap(date: string, startTime: string, endTime: string, currentId?: string) {
    const db = await this.getDb();
    
    // 1. Check regular schedules
    // Two intervals [s1, e1] and [s2, e2] overlap if s1 < e2 AND e1 > s2
    const overlappingSchedules = await db.getAllAsync<Schedule>(
      `SELECT * FROM schedules 
       WHERE is_deleted = 0 
       AND target_date = ? 
       AND start_time < ? 
       AND end_time > ?
       ${currentId ? 'AND id != ?' : ''}`,
      currentId ? [date, endTime, startTime, currentId] : [date, endTime, startTime]
    );

    if (overlappingSchedules.length > 0) {
      return {
        hasOverlap: true,
        conflictingItem: overlappingSchedules[0]
      };
    }

    // 2. Check routine templates
    const dayOfWeek = (new Date(date).getDay());
    const routineTemplates = await RoutineService.getAppliedTemplatesForDay(dayOfWeek);
    
    const conflictingRoutine = routineTemplates.find(t => 
      t.start_time < endTime && t.end_time > startTime
    );

    if (conflictingRoutine) {
      return {
        hasOverlap: true,
        conflictingItem: {
          ...conflictingRoutine,
          title: `[루틴] ${conflictingRoutine.title}`,
          is_routine: true
        }
      };
    }

    return { hasOverlap: false };
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
