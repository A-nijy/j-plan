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

  static async createTemplate(template: Omit<RoutineTemplate, 'id' | 'created_at' | 'updated_at'>) {
    const db = await this.getDb();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO routine_templates (id, title, description, start_time, end_time, color, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, template.title, template.description || null, template.start_time, template.end_time, template.color, now, now]
    );
    return id;
  }

  static async updateTemplate(id: string, template: Partial<Omit<RoutineTemplate, 'id' | 'created_at' | 'updated_at'>>) {
    const db = await this.getDb();
    const now = new Date().toISOString();
    
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

    await db.runAsync(
      `UPDATE routine_templates SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async deleteTemplate(id: string) {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM routine_templates WHERE id = ?', [id]);
    await db.runAsync('DELETE FROM routine_configs WHERE template_id = ?', [id]);
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
  static async getAppliedTemplatesForDay(dayOfWeek: number) {
    const db = await this.getDb();
    return await db.getAllAsync<RoutineTemplate>(
      `SELECT t.* FROM routine_templates t
       JOIN routine_configs c ON t.id = c.template_id
       WHERE c.day_of_week = ?`,
      [dayOfWeek]
    );
  }
}
