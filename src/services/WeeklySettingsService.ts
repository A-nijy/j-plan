import { getDb } from './database';

export interface WeeklySettings {
  id: string;
  view_mode: 'combined' | 'expanded';
  grid_interval: 10 | 20 | 30 | 60;
  start_hour: number;
  end_hour: number;
  updated_at: string;
}

export const WeeklySettingsService = {
  getSettings: async (): Promise<WeeklySettings> => {
    const db = await getDb();
    const settings = await db.getFirstAsync<WeeklySettings>('SELECT * FROM weekly_settings WHERE id = "default"');
    if (!settings) {
      // Should have been initialized in database.ts, but fallback just in case
      return {
        id: 'default',
        view_mode: 'combined',
        grid_interval: 60,
        start_hour: 0,
        end_hour: 23,
        updated_at: new Date().toISOString()
      };
    }
    return settings;
  },

  updateSettings: async (updates: Partial<Omit<WeeklySettings, 'id' | 'updated_at'>>) => {
    const db = await getDb();
    const fields = Object.keys(updates);
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    
    await db.runAsync(
      `UPDATE weekly_settings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = "default"`,
      ...values
    );
  }
};
