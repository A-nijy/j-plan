import * as SQLite from 'expo-sqlite';
import { SCHEMAS, MIGRATIONS } from './db/schema';

const DB_NAME = 'jplan.db';

export class DatabaseService {
  private static dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

  /**
   * Singleton pattern to get database instance
   */
  static getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = SQLite.openDatabaseAsync(DB_NAME);
    }
    return this.dbPromise;
  }

  /**
   * Main entry point for database initialization
   */
  static async initDatabase() {
    try {
      const db = await this.getDb();

      // 1. Core Schema Setup
      await this.setupSchemas(db);

      // 2. Migration: Dynamic Column Addition
      await this.runMigrations(db);

      // 3. Default Data Setup
      await this.setupDefaultSettings(db);

      // 4. Data Versioning/History Sync (Migration logic to keep for legacy db)
      await this.syncLegacyData(db);

      console.log('Database initialized successfully');
      return db;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private static async setupSchemas(db: SQLite.SQLiteDatabase) {
    for (const schema of Object.values(SCHEMAS)) {
      await db.execAsync(schema);
    }
  }

  private static async runMigrations(db: SQLite.SQLiteDatabase) {
    for (const query of MIGRATIONS) {
      try {
        await db.execAsync(query);
      } catch (e) {
        // Log skip for expected "columns already exist" errors
        // console.debug('Migration skipped or already applied:', query);
      }
    }
  }

  private static async setupDefaultSettings(db: SQLite.SQLiteDatabase) {
    const existingSettings = await db.getFirstAsync('SELECT id FROM weekly_settings WHERE id = "default"');
    if (!existingSettings) {
      await db.runAsync(
        'INSERT INTO weekly_settings (id, view_mode, grid_interval, start_hour, end_hour) VALUES ("default", "combined", 60, 0, 23)'
      );
    }
  }

  /**
   * Complex migration logic for historical data versioning.
   * Note: This is part of the "legacy preservation" request.
   */
  private static async syncLegacyData(db: SQLite.SQLiteDatabase) {
    // Sync todo_content_history description
    try {
      await db.execAsync(`
        UPDATE todo_content_history 
        SET description = (SELECT description FROM todos WHERE todos.id = todo_content_history.todo_id)
        WHERE description IS NULL
      `);
    } catch (e) { /* Safe skip if table busy */ }

    // Ensure all habits have initial history entries
    const allHabits = await db.getAllAsync<{ id: string, content: string, description: string, created_at: string }>(
      'SELECT id, content, description, created_at FROM todos WHERE type = "habit"'
    );

    for (const todo of allHabits) {
      const startDate = todo.created_at.split(' ')[0];
      const hasInitial = await db.getFirstAsync('SELECT id FROM todo_content_history WHERE todo_id = ? AND start_date <= ?', [todo.id, startDate]);
      if (!hasInitial) {
        await db.runAsync(
          `INSERT INTO todo_content_history (id, todo_id, content, description, start_date, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [`init_${todo.id}`, todo.id, todo.content, todo.description || null, startDate, todo.created_at]
        );
      }
    }

    // Sync routine content history baseline (Preserved Legacy Logic)
    const allRoutines = await db.getAllAsync<{ id: string, title: string, description: string, start_time: string, end_time: string, color: string, created_at: string }>(
      'SELECT id, title, description, start_time, end_time, color, created_at FROM routine_templates'
    );

    for (const routine of allRoutines) {
      const startDate = routine.created_at.split(' ')[0];
      const hasInitial = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM routine_content_history WHERE template_id = ? AND start_date <= ?',
        [routine.id, startDate]
      );

      const configs = await db.getAllAsync<{ day_of_week: number }>('SELECT day_of_week FROM routine_configs WHERE template_id = ?', [routine.id]);
      const daysOfWeek = configs.map(c => c.day_of_week).join(',');

      if (!hasInitial) {
        await db.runAsync(
          `INSERT INTO routine_content_history (id, template_id, title, description, start_time, end_time, color, days_of_week, start_date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [`init_${routine.id}`, routine.id, routine.title, routine.description || null, routine.start_time, routine.end_time, routine.color, daysOfWeek, startDate, routine.created_at]
        );
      } else {
        await db.runAsync(
          `UPDATE routine_content_history 
           SET start_time = COALESCE(start_time, ?), 
               end_time = COALESCE(end_time, ?), 
               color = COALESCE(color, ?), 
               days_of_week = COALESCE(days_of_week, ?)
           WHERE id = ?`,
          [routine.start_time, routine.end_time, routine.color, daysOfWeek, hasInitial.id]
        );
      }
    }
  }

  static async clearAllData() {
    try {
      const db = await this.getDb();
      await db.execAsync(`
        DELETE FROM schedules; DELETE FROM todos; DELETE FROM todo_completions;
        DELETE FROM todo_content_history; DELETE FROM routine_templates;
        DELETE FROM routine_configs; DELETE FROM routine_content_history;
        DELETE FROM routine_exceptions; DELETE FROM weekly_settings;
      `);
      await this.setupDefaultSettings(db);
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }
}

/**
 * Backward compatible exports for legacy components
 */
export const getDb = () => DatabaseService.getDb();
export const initDatabase = () => DatabaseService.initDatabase();
export const clearAllData = () => DatabaseService.clearAllData();
