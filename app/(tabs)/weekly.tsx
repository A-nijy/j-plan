import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../../src/constants/theme';
import { WeeklyGrid } from '../../src/components/WeeklyGrid';
import { ScheduleService } from '../../src/services/ScheduleService';
import { Schedule } from '../../src/types';
import { startOfWeek, endOfWeek, format, addDays } from 'date-fns';

export default function WeeklyScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

  useEffect(() => {
    loadWeeklySchedules();
  }, []);

  const loadWeeklySchedules = async () => {
    try {
      // For simplicity, we fetch all schedules that are recurring (have day_of_week)
      // or specific to this week's dates.
      // In a real app, we might need a more complex query.
      const allSchedules: Schedule[] = [];
      const db = await ScheduleService.getDb();
      
      const results = await db.getAllAsync<Schedule>(
        'SELECT * FROM schedules WHERE is_deleted = 0 AND (day_of_week IS NOT NULL OR (target_date BETWEEN ? AND ?))',
        [format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')]
      );
      
      setSchedules(results);
    } catch (error) {
      console.error('Failed to load weekly schedules:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.weekTitle}>
          {format(weekStart, 'MM.dd')} - {format(weekEnd, 'MM.dd')}
        </Text>
      </View>
      <View style={styles.content}>
        <WeeklyGrid schedules={schedules} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.sm,
  },
});
