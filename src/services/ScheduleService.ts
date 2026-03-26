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
    const singleSchedules = (await db.getAllAsync<any>(
      `SELECT * FROM schedules 
       WHERE is_deleted = 0 
       AND target_date = ?
       ORDER BY start_time ASC`,
      [date]
    )).map(s => ({
      ...s,
      is_routine: false,
      is_completed: s.is_completed === 1
    }));

    // 2. Get routine templates for this day of week
    const routineTemplates = await RoutineService.getAppliedTemplatesForDay(dayOfWeek, date);
    
    // 3. Get routine exceptions for this date
    const exceptions = await db.getAllAsync<{ routine_template_id: string, is_deleted: number, is_completed: number }>(
      'SELECT routine_template_id, is_deleted, is_completed FROM routine_exceptions WHERE exception_date = ?',
      [date]
    );
    
    const excludedIds = new Set(exceptions.filter(e => e.is_deleted === 1).map(e => e.routine_template_id));
    const routineCompletions = exceptions.reduce((acc, current) => {
      acc[current.routine_template_id] = current.is_completed === 1;
      return acc;
    }, {} as Record<string, boolean>);

    // Convert templates to schedule-like objects
    const routineSchedules = routineTemplates
      .filter(t => !excludedIds.has(t.id))
      .map(t => ({
        ...t,
        id: `routine::${t.id}::${date}`,
        target_date: date,
        is_routine: true,
        is_completed: routineCompletions[t.id] || false
      }));

    // Merge and sort: chronologically
    const merged = [...singleSchedules, ...routineSchedules].sort((a, b) => {
      // 1. Sort by start time first
      const timeCompare = a.start_time.localeCompare(b.start_time);
      if (timeCompare !== 0) return timeCompare;
      
      // 2. If same time, routine first
      if (!!a.is_routine !== !!b.is_routine) {
        return a.is_routine ? -1 : 1;
      }
      return 0;
    });

    return merged;
  }

  private static timeToMinutes(timeStr: string, isEnd: boolean = false): number {
    const [h, m] = timeStr.split(':').map(Number);
    let minutes = h * 60 + m;
    if (isEnd && minutes === 0) return 24 * 60; // 00:00 as end time is 1440 min
    return minutes;
  }

  static async checkOverlap(date: string, startTime: string, endTime: string, currentId?: string) {
    const db = await this.getDb();
    
    // Normalize input times to minutes
    const startMin = this.timeToMinutes(startTime);
    const endMin = this.timeToMinutes(endTime, true);
    
    // 1. Check regular schedules
    const schedules = await db.getAllAsync<Schedule>(
      `SELECT * FROM schedules WHERE is_deleted = 0 AND target_date = ? ${currentId && !currentId.startsWith('routine::') ? 'AND id != ?' : ''}`,
      currentId && !currentId.startsWith('routine::') ? [date, currentId] : [date]
    );

    const conflictingSchedule = schedules.find(s => {
      const sStart = this.timeToMinutes(s.start_time);
      const sEnd = this.timeToMinutes(s.end_time, true);
      // Overlap: s1 < e2 AND e1 > s2
      return sStart < endMin && sEnd > startMin;
    });

    if (conflictingSchedule) {
      return {
        hasOverlap: true,
        conflictingItem: conflictingSchedule
      };
    }

    // 2. Check routine templates
    const dayOfWeek = (new Date(date).getDay());
    const routineTemplates = await RoutineService.getAppliedTemplatesForDay(dayOfWeek, date);
    
    // Check exclusions
    const exclusions = await db.getAllAsync<{ routine_template_id: string }>(
      'SELECT routine_template_id FROM routine_exceptions WHERE exception_date = ?',
      [date]
    );
    const excludedIds = new Set(exclusions.map(e => e.routine_template_id));

    // If currentId is a routine, we should exclude its template from overlap check
    const excludeRoutineTemplateId = currentId?.startsWith('routine::') ? currentId.split('::')[1] : null;

    const conflictingRoutine = routineTemplates
      .filter(t => !excludedIds.has(t.id))
      .find(t => {
        // Exclude the routine itself we're currently "overriding" or "editing"
        if (excludeRoutineTemplateId && t.id === excludeRoutineTemplateId) return false;
        
        const tStart = this.timeToMinutes(t.start_time);
        const tEnd = this.timeToMinutes(t.end_time, true);
        return tStart < endMin && tEnd > startMin;
      });

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

  static async toggleScheduleCompletion(id: string, date: string, isRoutine: boolean, currentStatus: boolean) {
    const db = await this.getDb();
    const newStatus = currentStatus ? 0 : 1;

    try {
      if (isRoutine) {
        // For routines, we use routine_exceptions table
        const templateId = id.split('::')[1];
        
        // Use UPSERT (INSERT OR REPLACE)
        await db.runAsync(
          `INSERT INTO routine_exceptions (id, routine_template_id, exception_date, is_deleted, is_completed)
           VALUES (?, ?, ?, 0, ?)
           ON CONFLICT(routine_template_id, exception_date) 
           DO UPDATE SET is_completed = EXCLUDED.is_completed, is_deleted = 0`,
          [Crypto.randomUUID(), templateId, date, newStatus]
        );
      } else {
        // For single schedules, direct update
        await db.runAsync(
          'UPDATE schedules SET is_completed = ? WHERE id = ?',
          [newStatus, id]
        );
      }
    } catch (error) {
      console.error('Failed to toggle schedule completion:', error);
      throw error;
    }
  }

  static async deleteScheduleAtDate(id: string) {
    const db = await this.getDb();
    if (id.startsWith('routine::')) {
      const [, templateId, date] = id.split('::');
      await this.excludeRoutineFromDate(templateId, date, 1);
    } else {
      await db.runAsync('UPDATE schedules SET is_deleted = 1 WHERE id = ?', [id]);
    }
  }

  static async excludeRoutineFromDate(routineTemplateId: string, date: string, isDeleted: number = 1) {
    const db = await this.getDb();
    const id = Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO routine_exceptions (id, routine_template_id, exception_date, is_deleted)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(routine_template_id, exception_date) 
       DO UPDATE SET is_deleted = EXCLUDED.is_deleted`,
      [id, routineTemplateId, date, isDeleted]
    );
  }

  static async checkRoutineOverlap(days: number[], startTime: string, endTime: string, excludeTemplateId?: string) {
    const db = await this.getDb();
    const startMin = this.timeToMinutes(startTime);
    const endMin = this.timeToMinutes(endTime, true);
    
    for (const day of days) {
      // 1. Check against other routine templates
      // Use today's date for checkRoutineOverlap (future orientation)
      const todayStr = new Date().toISOString().split('T')[0];
      const routineTemplates = await RoutineService.getAppliedTemplatesForDay(day, todayStr);
      
      const conflictingRoutine = routineTemplates.find(t => {
        if (excludeTemplateId && t.id === excludeTemplateId) return false;
        
        const tStart = this.timeToMinutes(t.start_time);
        const tEnd = this.timeToMinutes(t.end_time, true);
        return tStart < endMin && tEnd > startMin;
      });

      if (conflictingRoutine) {
        const dayLabel = ['일', '월', '화', '수', '목', '금', '토'][day];
        return {
          hasOverlap: true,
          conflictingItem: {
            ...conflictingRoutine,
            title: `[${dayLabel}요일 루틴] ${conflictingRoutine.title}`,
            is_routine: true
          }
        };
      }

      // 2. Check against existing regular schedules on this day of week
      const dayLabel = ['일', '월', '화', '수', '목', '금', '토'][day];
      const schedulesOnDay = await db.getAllAsync<Schedule>(
        'SELECT * FROM schedules WHERE is_deleted = 0 AND day_of_week = ?',
        [day]
      );

      // Also check by date if schedules are target_date based
      // This is tricky because schedules can be for ANY specific date.
      // But typically, "strict" means if I add a Monday routine, I check ALL Mondays in the schedules table.
      const conflictingSchedule = schedulesOnDay.find(s => {
        const sStart = this.timeToMinutes(s.start_time);
        const sEnd = this.timeToMinutes(s.end_time, true);
        return sStart < endMin && sEnd > startMin;
      });

      if (conflictingSchedule) {
        return {
          hasOverlap: true,
          conflictingItem: {
            ...conflictingSchedule,
            title: `[${dayLabel}요일 일정] ${conflictingSchedule.title}`,
            is_routine: false
          }
        };
      }

      // 3. Final check: also check by target_date in schedules if those dates fall on this day of week
      // (Simplified: check ALL active specific schedules and see if their date matches this day of week)
      // This covers schedules with target_date = '2023-10-31' which is a Tuesday.
      const allSchedules = await db.getAllAsync<Schedule>(
        'SELECT * FROM schedules WHERE is_deleted = 0 AND target_date IS NOT NULL'
      );
      
      const conflictingDateSchedule = allSchedules.find(s => {
        const sDate = new Date(s.target_date!);
        if (sDate.getDay() !== day) return false;
        
        const sStart = this.timeToMinutes(s.start_time);
        const sEnd = this.timeToMinutes(s.end_time, true);
        return sStart < endMin && sEnd > startMin;
      });

      if (conflictingDateSchedule) {
        return {
          hasOverlap: true,
          conflictingItem: {
            ...conflictingDateSchedule,
            title: `[${conflictingDateSchedule.target_date} 일정] ${conflictingDateSchedule.title}`,
            is_routine: false
          }
        };
      }
    }

    return { hasOverlap: false };
  }

  /**
   * Checks if a deleted routine conflicts with existing items if restored
   */
  static async checkConflictForRestore(templateId: string, date: string) {
    const db = await this.getDb();
    
    // 1. Get the routine version for this date to know its time
    const version = await db.getFirstAsync<{ start_time: string, end_time: string, title: string }>(
      `SELECT start_time, end_time, title FROM routine_content_history 
       WHERE template_id = ? AND start_date <= ? 
       ORDER BY start_date DESC LIMIT 1`,
      [templateId, date]
    );

    if (!version) return { hasOverlap: false };

    // 2. Use checkOverlap to see if this time slot is free
    // Since it's currently deleted (in routine_exceptions), checkOverlap will consider it a conflict
    // if there's anything else in that slot.
    return await this.checkOverlap(date, version.start_time, version.end_time);
  }
}
