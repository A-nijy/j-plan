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
        is_completed INTEGER DEFAULT 0,
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
    try {
      await db.execAsync("ALTER TABLE schedules ADD COLUMN is_completed INTEGER DEFAULT 0;");
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
        item_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_deleted INTEGER DEFAULT 0
      );
    `);
    try {
      await db.execAsync("ALTER TABLE todos ADD COLUMN item_order INTEGER DEFAULT 0;");
    } catch (e) { /* Column might already exist */ }

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

    // Todo Exceptions/History/Completions Table (New)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS todo_completions (
        id TEXT PRIMARY KEY NOT NULL,
        todo_id TEXT NOT NULL,
        completed_date TEXT NOT NULL,
        status INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(todo_id, completed_date)
      );
    `);

    // Todo Content History Table (Versioning)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS todo_content_history (
        id TEXT PRIMARY KEY NOT NULL,
        todo_id TEXT NOT NULL,
        content TEXT NOT NULL,
        start_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
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

    // Routine Content History Table (Versioning)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS routine_content_history (
        id TEXT PRIMARY KEY NOT NULL,
        template_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_time TEXT,
        end_time TEXT,
        color TEXT,
        days_of_week TEXT,
        start_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration for routine_content_history (Expand for existing tables)
    try {
      await db.execAsync("ALTER TABLE routine_content_history ADD COLUMN start_time TEXT;");
    } catch (e) { /* Column might already exist */ }
    try {
      await db.execAsync("ALTER TABLE routine_content_history ADD COLUMN end_time TEXT;");
    } catch (e) { /* Column might already exist */ }
    try {
      await db.execAsync("ALTER TABLE routine_content_history ADD COLUMN color TEXT;");
    } catch (e) { /* Column might already exist */ }
    try {
      await db.execAsync("ALTER TABLE routine_content_history ADD COLUMN days_of_week TEXT;");
    } catch (e) { /* Column might already exist */ }

    // Routine Exceptions Table (Specific dates to hide or mark completed a routine)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS routine_exceptions (
        id TEXT PRIMARY KEY NOT NULL,
        routine_template_id TEXT NOT NULL,
        exception_date TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 1,
        is_completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(routine_template_id, exception_date)
      );
    `);

    // Migration for routine_exceptions
    try {
      await db.execAsync("ALTER TABLE routine_exceptions ADD COLUMN is_deleted INTEGER DEFAULT 1;");
    } catch (e) { /* Column might already exist */ }
    try {
      await db.execAsync("ALTER TABLE routine_exceptions ADD COLUMN is_completed INTEGER DEFAULT 0;");
    } catch (e) { /* Column might already exist */ }

    // Initialize default settings if not exists
    const existingSettings = await db.getFirstAsync('SELECT id FROM weekly_settings WHERE id = "default"');
    if (!existingSettings) {
      await db.runAsync('INSERT INTO weekly_settings (id, view_mode, grid_interval, start_hour, end_hour) VALUES ("default", "combined", 60, 0, 23)');
    }

    // Migration: Ensure all todos have at least one entry in todo_content_history for their creation date
    const allHabits = await db.getAllAsync<{ id: string, content: string, created_at: string }>(
      'SELECT id, content, created_at FROM todos WHERE type = "habit"'
    );

    for (const todo of allHabits) {
      const startDate = todo.created_at.split(' ')[0]; // YYYY-MM-DD
      const hasInitialHistory = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM todo_content_history WHERE todo_id = ? AND start_date <= ?',
        [todo.id, startDate]
      );

      if (!hasInitialHistory) {
        await db.runAsync(
          `INSERT INTO todo_content_history (id, todo_id, content, start_date, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [`init_${todo.id}`, todo.id, todo.content, startDate, todo.created_at]
        );
      }
    }

    // Migration: Ensure all routine templates have at least one entry in routine_content_history for their creation date
    const allRoutines = await db.getAllAsync<{ id: string, title: string, description: string, start_time: string, end_time: string, color: string, created_at: string }>(
      'SELECT id, title, description, start_time, end_time, color, created_at FROM routine_templates'
    );

    for (const routine of allRoutines) {
      const startDate = routine.created_at.split(' ')[0]; // YYYY-MM-DD
      const hasInitialHistory = await db.getFirstAsync<{ id: string, start_time: string }>(
        'SELECT id, start_time FROM routine_content_history WHERE template_id = ? AND start_date <= ?',
        [routine.id, startDate]
      );

      // Fetch days_of_week for this template
      const configs = await db.getAllAsync<{ day_of_week: number }>(
        'SELECT day_of_week FROM routine_configs WHERE template_id = ?',
        [routine.id]
      );
      const daysOfWeek = configs.map(c => c.day_of_week).join(',');

      if (!hasInitialHistory) {
        await db.runAsync(
          `INSERT INTO routine_content_history (id, template_id, title, description, start_time, end_time, color, days_of_week, start_date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [`init_${routine.id}`, routine.id, routine.title, routine.description || null, routine.start_time, routine.end_time, routine.color, daysOfWeek, startDate, routine.created_at]
        );
      } else {
        // Expand existing partial history if any columns are missing (null)
        await db.runAsync(
          `UPDATE routine_content_history 
           SET start_time = COALESCE(start_time, ?), 
               end_time = COALESCE(end_time, ?), 
               color = COALESCE(color, ?), 
               days_of_week = COALESCE(days_of_week, ?)
           WHERE id = ?`,
          [routine.start_time, routine.end_time, routine.color, daysOfWeek, hasInitialHistory.id]
        );
      }
    }

    console.log('Database tables initialized');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export const clearAllData = async () => {
  try {
    const db = await getDb();
    
    // Deleting data from all tables
    await db.execAsync(`
      DELETE FROM schedules;
      DELETE FROM todos;
      DELETE FROM todo_completions;
      DELETE FROM todo_content_history;
      DELETE FROM routine_templates;
      DELETE FROM routine_configs;
      DELETE FROM routine_content_history;
      DELETE FROM routine_exceptions;
      DELETE FROM weekly_settings;
    `);

    // Restore default settings
    await db.runAsync('INSERT INTO weekly_settings (id, view_mode, grid_interval, start_hour, end_hour) VALUES ("default", "combined", 60, 0, 23)');
    
    console.log('All data cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear data:', error);
    return false;
  }
};
