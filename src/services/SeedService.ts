import * as Crypto from 'expo-crypto';
import { DatabaseService } from './database';

export class SeedService {
  static async seedTestData() {
    const db = await DatabaseService.getDb();
    if (!db) return;

    console.log('Starting seed process...');

    try {
      // 1. Create Routines (Created at 2026-03-11)
      const routines = [
        { id: 'seed_r1', title: '아침 운동', desc: '매일 건강을 위해', start: '07:00', end: '08:00', color: '#3B82F6', days: '0,1,2,3,4,5,6' },
        { id: 'seed_r2', title: '독서', desc: '지식 쌓기', start: '20:00', end: '21:00', color: '#10B981', days: '1,2,3' },
        { id: 'seed_r3', title: '영어 공부', desc: '회화 연습', start: '13:00', end: '14:00', color: '#F59E0B', days: '1,3,5' },
        { id: 'seed_r4', title: '유튜브 시청', desc: '휴식 시간', start: '22:00', end: '23:00', color: '#8B5CF6', days: '2,5,6,0' },
      ];

      const seedDate = '2026-03-11T09:00:00.000Z';
      const seedDateShort = '2026-03-11';

      for (const r of routines) {
        // Insert Template
        await db.runAsync(
          'INSERT OR IGNORE INTO routine_templates (id, title, description, start_time, end_time, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [r.id, r.title, r.desc, r.start, r.end, r.color, seedDate]
        );
        // Insert Configs (Day assignments)
        const daysArray = r.days.split(',').map(Number);
        for (const day of daysArray) {
          await db.runAsync(
            'INSERT OR IGNORE INTO routine_configs (id, template_id, day_of_week) VALUES (?, ?, ?)',
            [`seed_cfg_${r.id}_${day}`, r.id, day]
          );
        }
        // Insert History
        await db.runAsync(
          'INSERT OR IGNORE INTO routine_content_history (id, template_id, title, description, start_time, end_time, color, days_of_week, start_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [`hist_${r.id}`, r.id, r.title, r.desc, r.start, r.end, r.color, r.days, seedDateShort, seedDate]
        );
      }

      // 2. Create Daily Habits (Todos)
      const habits = [
        { id: 'seed_h1', title: '물 2L 마시기', date: '2026-03-11' },
        { id: 'seed_h2', title: '영양제 먹기', date: '2026-03-15' },
        { id: 'seed_h3', title: '일기 쓰기', date: '2026-03-18' },
      ];

      for (const h of habits) {
        const createdAt = `${h.date}T09:00:00.000Z`;
        await db.runAsync(
          'INSERT OR IGNORE INTO todos (id, content, is_completed, type, created_at) VALUES (?, ?, 0, "habit", ?)',
          [h.id, h.title, createdAt]
        );
        // Habit history for name persistence
        await db.runAsync(
          'INSERT OR IGNORE INTO todo_content_history (id, todo_id, content, start_date, created_at) VALUES (?, ?, ?, ?, ?)',
          [`hist_${h.id}`, h.id, h.title, h.date, createdAt]
        );
      }

      // 3. Create 10 Individual Schedules (Random between 3/11 and today 3/26)
      const scheduleTitles = ['마트 장보기', '친구 약속', '카페 업무', '집 청소', '빨래', '영화 관람', '미용실 가기', '은행 방문', '병원 검진', '택배 보내기'];
      for (let i = 0; i < 10; i++) {
        const randomDay = Math.floor(Math.random() * 15) + 11; // 11 to 25
        const targetDate = `2026-03-${randomDay.toString().padStart(2, '0')}`;
        const startHour = 9 + Math.floor(Math.random() * 8); // 9:00 to 17:00
        const startTime = `${startHour.toString().padStart(2, '0')}:00`;
        const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00`;
        
        await db.runAsync(
          'INSERT INTO schedules (id, title, start_time, end_time, color, target_date, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)',
          [Crypto.randomUUID(), scheduleTitles[i], startTime, endTime, '#6366F1', targetDate, seedDate, seedDate]
        );
      }

      // 4. Create 10 Individual Todos (Random between 3/11 and today 3/26)
      const todoTitles = ['쓰레기 버리기', '책 반납하기', '고지서 납부', '화분 물주기', '비밀번호 변경', '영수증 정리', '컴퓨터 백업', '신발 세탁', '장바구니 확인', '메일 확인'];
      for (let i = 0; i < 10; i++) {
        const randomDay = Math.floor(Math.random() * 15) + 11; // 11 to 25
        const targetDate = `2026-03-${randomDay.toString().padStart(2, '0')}`;
        const createdAt = `${targetDate}T10:00:00.000Z`;
        
        await db.runAsync(
          'INSERT INTO todos (id, content, is_completed, type, target_date, created_at) VALUES (?, ?, 0, "daily", ?, ?)',
          [Crypto.randomUUID(), todoTitles[i], targetDate, createdAt]
        );
      }

      console.log('Seed process completed successfully!');
      return true;
    } catch (error) {
      console.error('Seed process failed:', error);
      return false;
    }
  }
}
