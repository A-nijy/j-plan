/**
 * Database Table Schemas and Migrations
 */

export const SCHEMAS = {
  schedules: `
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
  `,
  todos: `
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY NOT NULL,
      content TEXT NOT NULL,
      description TEXT,
      is_completed INTEGER DEFAULT 0,
      type TEXT NOT NULL,
      target_date TEXT,
      habit_days TEXT,
      item_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0
    );
  `,
  weekly_settings: `
    CREATE TABLE IF NOT EXISTS weekly_settings (
      id TEXT PRIMARY KEY NOT NULL,
      view_mode TEXT DEFAULT 'combined',
      grid_interval INTEGER DEFAULT 60,
      start_hour INTEGER DEFAULT 0,
      end_hour INTEGER DEFAULT 23,
      show_circular_clock INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `,
  todo_completions: `
    CREATE TABLE IF NOT EXISTS todo_completions (
      id TEXT PRIMARY KEY NOT NULL,
      todo_id TEXT NOT NULL,
      completed_date TEXT NOT NULL,
      status INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(todo_id, completed_date)
    );
  `,
  todo_content_history: `
    CREATE TABLE IF NOT EXISTS todo_content_history (
      id TEXT PRIMARY KEY NOT NULL,
      todo_id TEXT NOT NULL,
      content TEXT NOT NULL,
      description TEXT,
      start_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `,
  routine_templates: `
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
  `,
  routine_configs: `
    CREATE TABLE IF NOT EXISTS routine_configs (
      id TEXT PRIMARY KEY NOT NULL,
      template_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL
    );
  `,
  routine_content_history: `
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
  `,
  routine_exceptions: `
    CREATE TABLE IF NOT EXISTS routine_exceptions (
      id TEXT PRIMARY KEY NOT NULL,
      routine_template_id TEXT NOT NULL,
      exception_date TEXT NOT NULL,
      is_deleted INTEGER DEFAULT 1,
      is_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(routine_template_id, exception_date)
    );
  `
};

export const MIGRATIONS = [
  "ALTER TABLE schedules ADD COLUMN day_of_week INTEGER;",
  "ALTER TABLE schedules ADD COLUMN target_date TEXT;",
  "ALTER TABLE schedules ADD COLUMN is_completed INTEGER DEFAULT 0;",
  "ALTER TABLE todos ADD COLUMN item_order INTEGER DEFAULT 0;",
  "ALTER TABLE todos ADD COLUMN description TEXT;",
  "ALTER TABLE todo_content_history ADD COLUMN description TEXT;",
  "ALTER TABLE weekly_settings ADD COLUMN show_circular_clock INTEGER DEFAULT 1;",
  "ALTER TABLE routine_templates ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;",
  "ALTER TABLE routine_content_history ADD COLUMN start_time TEXT;",
  "ALTER TABLE routine_content_history ADD COLUMN end_time TEXT;",
  "ALTER TABLE routine_content_history ADD COLUMN color TEXT;",
  "ALTER TABLE routine_content_history ADD COLUMN days_of_week TEXT;",
  "ALTER TABLE routine_exceptions ADD COLUMN is_deleted INTEGER DEFAULT 1;",
  "ALTER TABLE routine_exceptions ADD COLUMN is_completed INTEGER DEFAULT 0;"
];
