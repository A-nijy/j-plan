import * as SQLite from 'expo-sqlite';

const DB_NAME = 'jplan.db';

export const initDatabase = async () => {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

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

  return db;
};
