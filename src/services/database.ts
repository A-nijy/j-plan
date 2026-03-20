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

    console.log('Database tables initialized');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};
