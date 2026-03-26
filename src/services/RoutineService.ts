import * as Crypto from 'expo-crypto';
import { getDb } from './database';
import { RoutineTemplate, RoutineConfig } from '../types';

export class RoutineService {
  static async getDb() {
    const db = await getDb();
    if (!db) throw new Error('Database not initialized');
    return db;
  }

  static async getTemplates() {
    const db = await this.getDb();
    return await db.getAllAsync<RoutineTemplate>(
      'SELECT * FROM routine_templates ORDER BY created_at DESC'
    );
  }

  static async createTemplate(template: Omit<RoutineTemplate, 'id' | 'created_at' | 'updated_at'>, initialDays: number[] = []) {
    const db = await this.getDb();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    await db.runAsync(
      `INSERT INTO routine_templates (id, title, description, start_time, end_time, color, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, template.title, template.description || null, template.start_time, template.end_time, template.color, now, now]
    );

    // If initial days are provided, add to routine_configs
    if (initialDays.length > 0) {
      for (const day of initialDays) {
        await db.runAsync(
          'INSERT INTO routine_configs (id, template_id, day_of_week) VALUES (?, ?, ?)',
          [Crypto.randomUUID(), id, day]
        );
      }
    }

    // Initial content history with all properties
    await db.runAsync(
      `INSERT INTO routine_content_history (id, template_id, title, description, start_time, end_time, color, days_of_week, start_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [Crypto.randomUUID(), id, template.title, template.description || null, template.start_time, template.end_time, template.color, initialDays.join(','), today, now]
    );

    return id;
  }

  static async updateTemplate(id: string, template: Partial<Omit<RoutineTemplate, 'id' | 'created_at' | 'updated_at'>>) {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    // Check if anything changed that requires a new version
    const currentFull = await db.getFirstAsync<{ title: string, description: string, start_time: string, end_time: string, color: string, created_at: string }>(
      'SELECT title, description, start_time, end_time, color, created_at FROM routine_templates WHERE id = ?',
      [id]
    );

    if (currentFull) {
      const isContentChanged = 
        (template.title !== undefined && template.title !== currentFull.title) ||
        (template.description !== undefined && template.description !== currentFull.description) ||
        (template.start_time !== undefined && template.start_time !== currentFull.start_time) ||
        (template.end_time !== undefined && template.end_time !== currentFull.end_time) ||
        (template.color !== undefined && template.color !== currentFull.color);

      if (isContentChanged) {
        // Ensure baseline exists
        const hasHistory = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM routine_content_history WHERE template_id = ? LIMIT 1',
          [id]
        );

        const configs = await db.getAllAsync<{ day_of_week: number }>(
          'SELECT day_of_week FROM routine_configs WHERE template_id = ?',
          [id]
        );
        const currentDays = configs.map(c => c.day_of_week).join(',');

        if (!hasHistory) {
          const originalStartDate = currentFull.created_at.split(' ')[0];
          await db.runAsync(
            `INSERT INTO routine_content_history (id, template_id, title, description, start_time, end_time, color, days_of_week, start_date, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [`init_${id}`, id, currentFull.title, currentFull.description || null, currentFull.start_time, currentFull.end_time, currentFull.color, currentDays, originalStartDate, currentFull.created_at]
          );
        }

        // Record new version for today
        const existingAtToday = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM routine_content_history WHERE template_id = ? AND start_date = ?',
          [id, today]
        );

        const newTitle = template.title !== undefined ? template.title : currentFull.title;
        const newDesc = template.description !== undefined ? template.description : currentFull.description;
        const newStart = template.start_time !== undefined ? template.start_time : currentFull.start_time;
        const newEnd = template.end_time !== undefined ? template.end_time : currentFull.end_time;
        const newColor = template.color !== undefined ? template.color : currentFull.color;

        if (existingAtToday) {
          await db.runAsync(
            `UPDATE routine_content_history SET title = ?, description = ?, start_time = ?, end_time = ?, color = ?, days_of_week = ?
             WHERE id = ?`,
            [newTitle, newDesc, newStart, newEnd, newColor, currentDays, existingAtToday.id]
          );
        } else {
          await db.runAsync(
            `INSERT INTO routine_content_history (id, template_id, title, description, start_time, end_time, color, days_of_week, start_date, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [Crypto.randomUUID(), id, newTitle, newDesc, newStart, newEnd, newColor, currentDays, today, now]
          );
        }
      }
    }
    
    // Update main table
    const fields = [];
    const values = [];
    if (template.title) { fields.push('title = ?'); values.push(template.title); }
    if (template.description !== undefined) { fields.push('description = ?'); values.push(template.description); }
    if (template.start_time) { fields.push('start_time = ?'); values.push(template.start_time); }
    if (template.end_time) { fields.push('end_time = ?'); values.push(template.end_time); }
    if (template.color) { fields.push('color = ?'); values.push(template.color); }
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db.runAsync(`UPDATE routine_templates SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  static async deleteTemplate(id: string) {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM routine_templates WHERE id = ?', [id]);
    await db.runAsync('DELETE FROM routine_configs WHERE template_id = ?', [id]);
    await db.runAsync('DELETE FROM routine_content_history WHERE template_id = ?', [id]);
  }

  static async getConfigs(templateId: string) {
    const db = await this.getDb();
    return await db.getAllAsync<RoutineConfig>(
      'SELECT * FROM routine_configs WHERE template_id = ?',
      [templateId]
    );
  }

  static async updateConfigs(templateId: string, days: number[]) {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    // Check if days changed
    const currentConfigs = await db.getAllAsync<{ day_of_week: number }>(
      'SELECT day_of_week FROM routine_configs WHERE template_id = ?',
      [templateId]
    );
    const currentDays = currentConfigs.map(c => c.day_of_week).sort().join(',');
    const newDays = [...days].sort().join(',');

    if (currentDays !== newDays) {
      // Ensure baseline history exists
      const hasHistory = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM routine_content_history WHERE template_id = ? LIMIT 1',
        [templateId]
      );
      
      const currentFull = await db.getFirstAsync<{ title: string, description: string, start_time: string, end_time: string, color: string, created_at: string }>(
        'SELECT * FROM routine_templates WHERE id = ?',
        [templateId]
      );

      if (currentFull && !hasHistory) {
        const originalStartDate = currentFull.created_at.split(' ')[0];
        await db.runAsync(
          `INSERT INTO routine_content_history (id, template_id, title, description, start_time, end_time, color, days_of_week, start_date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [`init_${templateId}`, templateId, currentFull.title, currentFull.description || null, currentFull.start_time, currentFull.end_time, currentFull.color, currentDays, originalStartDate, currentFull.created_at]
        );
      }

      // Record new version with updated days
      const existingAtToday = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM routine_content_history WHERE template_id = ? AND start_date = ?',
        [templateId, today]
      );

      if (currentFull) {
        if (existingAtToday) {
          await db.runAsync(
            'UPDATE routine_content_history SET days_of_week = ? WHERE id = ?',
            [newDays, existingAtToday.id]
          );
        } else {
          await db.runAsync(
            `INSERT INTO routine_content_history (id, template_id, title, description, start_time, end_time, color, days_of_week, start_date, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [Crypto.randomUUID(), templateId, currentFull.title, currentFull.description || null, currentFull.start_time, currentFull.end_time, currentFull.color, newDays, today, now]
          );
        }
      }
    }

    // Update main configs
    await db.runAsync('DELETE FROM routine_configs WHERE template_id = ?', [templateId]);
    for (const day of days) {
      await db.runAsync(
        'INSERT INTO routine_configs (id, template_id, day_of_week) VALUES (?, ?, ?)',
        [Crypto.randomUUID(), templateId, day]
      );
    }
  }

  /**
   * Returns templates assigned to a specific day of the week
   */
  static async getAppliedTemplatesForDay(dayOfWeek: number, date: string) {
    const db = await this.getDb();
    
    // Performance optimization: 
    // 1. Find all routine IDs active for this template identity (matching the creation date condition)
    const baseTemplates = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM routine_templates WHERE DATE(created_at) <= DATE(?)',
      [date]
    );

    const result: any[] = [];

    for (const bt of baseTemplates) {
      // 2. Find the latest version of this routine on the given date
      const version = await db.getFirstAsync<any>(
        `SELECT * FROM routine_content_history 
         WHERE template_id = ? AND start_date <= ? 
         ORDER BY start_date DESC LIMIT 1`,
        [bt.id, date]
      );

      if (version) {
        // 3. Check if the version applies to this day of the week
        const daysOfWeekStr = version.days_of_week || '';
        const daysArray = daysOfWeekStr.split(',').filter((d: string) => d !== '').map(Number);
        if (daysArray.includes(dayOfWeek)) {
          result.push({
            id: version.template_id,
            title: version.title,
            description: version.description,
            start_time: version.start_time || '09:00',
            end_time: version.end_time || '10:00',
            color: version.color || '#A0C4FF',
            created_at: version.created_at
          });
        }
      }
    }

    return result;
  }
}
