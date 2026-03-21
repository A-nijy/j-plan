import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Schedule } from '../types';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 7;
const HOUR_HEIGHT = 60;

import { startOfWeek, format, addDays, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { WeeklySettings } from '../services/WeeklySettingsService';

interface WeeklyGridProps {
  schedules: Schedule[];
  onPressSchedule?: (schedule: Schedule) => void;
  startDate?: Date;
  settings: WeeklySettings;
}

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({ schedules, onPressSchedule, startDate = new Date(), settings }) => {
  const { start_hour, end_hour, grid_interval } = settings;
  const hours = [];
  for (let i = start_hour; i <= end_hour; i++) {
    hours.push(i);
  }
  
  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Start from Monday
  const today = new Date();
 
  const getScheduleStyle = (schedule: Schedule) => {
    const [startH, startM] = schedule.start_time.split(':').map(Number);
    const [endH, endM] = schedule.end_time.split(':').map(Number);
    
    // Position relative to start_hour
    const top = (startH - start_hour) * HOUR_HEIGHT + (startM / 60) * HOUR_HEIGHT;
    const height = (endH - startH) * HOUR_HEIGHT + ((endM - startM) / 60) * HOUR_HEIGHT;
    
    // Calculate dayIndex: prefer day_of_week, fallback to target_date
    let dayIndex = 0;
    if (schedule.day_of_week !== null && schedule.day_of_week !== undefined) {
      dayIndex = (schedule.day_of_week + 6) % 7;
    } else if (schedule.target_date) {
      dayIndex = (new Date(schedule.target_date).getDay() + 6) % 7;
    }

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
  const subLinesCount = 60 / grid_interval;
 
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
              <View key={h} style={styles.hourSlot}>
                {Array.from({ length: subLinesCount }).map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.gridLine, 
                      { height: HOUR_HEIGHT / subLinesCount },
                      i > 0 && { borderStyle: 'dashed', borderBottomColor: COLORS.border + '50' }
                    ]} 
                  />
                ))}
              </View>
            ))}
            
            {schedules.map((s) => {
              const style = getScheduleStyle(s);
              // Only render if it's within the visible hour range
              if (style.top < 0 || style.top >= hours.length * HOUR_HEIGHT) return null;
              
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.scheduleBlock, style]}
                  onPress={() => onPressSchedule?.(s)}
                >
                  <Text style={styles.scheduleTitle} numberOfLines={2}>
                    {s.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
  hourSlot: {
    height: HOUR_HEIGHT,
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
