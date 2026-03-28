export type ID = string;

export interface BaseEntity {
  id: ID;
  created_at: string;
  updated_at: string;
  is_deleted: number; // SQLite lacks boolean, use 0/1
}

export interface Schedule extends BaseEntity {
  title: string;
  description?: string;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  color: string;
  day_of_week?: number; // 0-6 (Sun-Sat), null for specific date
  target_date?: string;  // YYYY-MM-DD, null for recurring weekly
  is_routine?: boolean;  // Flag for routine templates
  is_completed?: boolean;
}

export interface Todo extends BaseEntity {
  content: string; // Title
  description?: string; // Detailed content
  is_completed: number;
  type: 'habit' | 'daily';
  target_date?: string; // For daily todos
  habit_days?: string;  // For habits (e.g., "1,2,3,4,5" for weekdays)
}

export interface Category extends BaseEntity {
  name: string;
  color: string;
  icon?: string;
}
export interface RoutineTemplate {
  id: string;
  title: string;
  description?: string;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  color: string;
  created_at: string;
  updated_at: string;
}

export interface RoutineConfig {
  id: string;
  template_id: string;
  day_of_week: number; // 0-6
}
