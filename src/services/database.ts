import * as SQLite from 'expo-sqlite';

const DB_NAME = 'jplan.db';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDb = () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
};

export const initDatabase = async () => {
  try {
    const db = await getDb();

    // Schedules Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        color TEXT NOT NULL,
        day_of_week INTEGER,
        target_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_deleted INTEGER DEFAULT 0
      );
    `);

    // Migration: Add columns if they don't exist (handle legacy db)
    try {
      await db.execAsync("ALTER TABLE schedules ADD COLUMN day_of_week INTEGER;");
    } catch (e) { /* Column might already exist */ }
    try {
      await db.execAsync("ALTER TABLE schedules ADD COLUMN target_date TEXT;");
    } catch (e) { /* Column might already exist */ }

    // Todos Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY NOT NULL,
        content TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0,
        type TEXT NOT NULL,
        target_date TEXT,
        habit_days TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_deleted INTEGER DEFAULT 0
      );
    `);

    // Weekly Settings Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS weekly_settings (
        id TEXT PRIMARY KEY NOT NULL,
        view_mode TEXT DEFAULT 'combined',
        grid_interval INTEGER DEFAULT 60,
        start_hour INTEGER DEFAULT 0,
        end_hour INTEGER DEFAULT 23,
        show_circular_clock INTEGER DEFAULT 1,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration for weekly_settings
    try {
      await db.execAsync("ALTER TABLE weekly_settings ADD COLUMN show_circular_clock INTEGER DEFAULT 1;");
    } catch (e) { /* Column might already exist */ }

    // Routine Templates Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS routine_templates (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration for routine_templates
    try {
      await db.execAsync("ALTER TABLE routine_templates ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;");
    } catch (e) { /* Column might already exist */ }

    // Routine Configs Table (Day of Week assignments)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS routine_configs (
        id TEXT PRIMARY KEY NOT NULL,
        template_id TEXT NOT NULL,
        day_of_week INTEGER NOT NULL
      );
    `);

    // Initialize default settings if not exists
    const existingSettings = await db.getFirstAsync('SELECT id FROM weekly_settings WHERE id = "default"');
    if (!existingSettings) {
      await db.runAsync('INSERT INTO weekly_settings (id, view_mode, grid_interval, start_hour, end_hour) VALUES ("default", "combined", 60, 0, 23)');
    }

    console.log('Database tables initialized');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};
