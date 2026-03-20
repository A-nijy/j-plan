import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Schedule } from '../types';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 7;
const HOUR_HEIGHT = 60;

import { startOfWeek, format, addDays, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';

interface WeeklyGridProps {
  schedules: Schedule[];
  onPressSchedule?: (schedule: Schedule) => void;
  startDate?: Date;
}

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({ schedules, onPressSchedule, startDate = new Date() }) => {
  const hours = [...Array(15)].map((_, i) => i + 8); // 8:00 to 22:00
  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Start from Monday
  const today = new Date();

  const getScheduleStyle = (schedule: Schedule) => {
    const [startH, startM] = schedule.start_time.split(':').map(Number);
    const [endH, endM] = schedule.end_time.split(':').map(Number);
    
    const top = (startH - 8) * HOUR_HEIGHT + (startM / 60) * HOUR_HEIGHT;
    const height = (endH - startH) * HOUR_HEIGHT + ((endM - startM) / 60) * HOUR_HEIGHT;
    
    // adjust day_of_week (stored as 0-6). 
    // If we start week on Monday (1), then Monday is index 0.
    // getDay() returns 0 for Sunday, 1 for Monday.
    // So if startOfWeek is Monday, then day index for a date is (getDay() + 6) % 7? No.
    // Just use date-fns to find difference in days from weekStart.
    // Wait, the schedule has a 'day_of_week' field. We should use it or calculate from a date.
    // Current app uses 0=Sunday? Let's assume 1=Mon, 2=Tue... 0=Sun.
    const dayIndex = (schedule.day_of_week + 6) % 7; // Monday = 0, Tuesday = 1, ..., Sunday = 6
    const left = dayIndex * COLUMN_WIDTH;

    return {
      top,
      height,
      left,
      width: COLUMN_WIDTH - 2,
      backgroundColor: schedule.color,
    };
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <View style={styles.container}>
      {/* Day Labels with Dates */}
      <View style={styles.dayHeader}>
        <View style={styles.hourColPlaceholder} />
        {weekDates.map((date, i) => {
          const isToday = isSameDay(date, today);
          return (
            <View key={i} style={[styles.dayLabel, isToday && styles.todayLabel]}>
              <Text style={[styles.dayText, isToday && styles.todayDayText]}>
                {format(date, 'eee', { locale: ko })}
              </Text>
              <Text style={[styles.dateText, isToday && styles.todayDateText]}>
                {format(date, 'd')}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView style={styles.gridScroll}>
        <View style={styles.gridBody}>
          {/* Hour Labels */}
          <View style={styles.hourColumn}>
            {hours.map((h) => (
              <View key={h} style={styles.hourCell}>
                <Text style={styles.hourText}>{h}:00</Text>
              </View>
            ))}
          </View>

          {/* Grid lines and Schedules */}
          <View style={styles.slotsContainer}>
            {hours.map((h) => (
              <View key={h} style={styles.gridLine} />
            ))}
            
            {schedules.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.scheduleBlock, getScheduleStyle(s)]}
                onPress={() => onPressSchedule?.(s)}
              >
                <Text style={styles.scheduleTitle} numberOfLines={2}>
                  {s.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  hourColPlaceholder: {
    width: 50,
  },
  dayLabel: {
    flex: 1,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  todayLabel: {
    backgroundColor: COLORS.primary + '08',
  },
  dayText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  todayDayText: {
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  todayDateText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  gridScroll: {
    flex: 1,
  },
  gridBody: {
    flexDirection: 'row',
  },
  hourColumn: {
    width: 50,
    backgroundColor: COLORS.background,
  },
  hourCell: {
    height: HOUR_HEIGHT,
    alignItems: 'center',
    paddingTop: 4,
  },
  hourText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  slotsContainer: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    height: HOUR_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  scheduleBlock: {
    position: 'absolute',
    borderRadius: 4,
    padding: 2,
    zIndex: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  scheduleTitle: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: 'bold',
  },
});
