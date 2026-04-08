import { useState, useCallback } from 'react';
import { WeeklySettings, WeeklySettingsService } from '../services/WeeklySettingsService';

export const useTodaySettings = () => {
  const [settings, setSettings] = useState<WeeklySettings | null>(null);

  const loadSettings = useCallback(async () => {
    const data = await WeeklySettingsService.getSettings();
    setSettings(data);
  }, []);

  const toggleClock = async () => {
    if (!settings) return;
    const newShowClock = settings.show_circular_clock === 1 ? 0 : 1;
    await WeeklySettingsService.updateSettings({ show_circular_clock: newShowClock });
    await loadSettings();
  };

  return {
    settings,
    loadSettings,
    toggleClock,
  };
};
