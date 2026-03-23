import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Schedule } from '../types';

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
  
  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday
  const today = new Date();
 
  const getScheduleStyle = (schedule: Schedule) => {
    const [startH, startM] = schedule.start_time.split(':').map(Number);
    const [endH, endM] = schedule.end_time.split(':').map(Number);
    
    const top = (startH - start_hour) * HOUR_HEIGHT + (startM / 60) * HOUR_HEIGHT;
    const height = (endH - startH) * HOUR_HEIGHT + ((endM - startM) / 60) * HOUR_HEIGHT;
    
    let dayIndex = 0;
    if (schedule.day_of_week !== null && schedule.day_of_week !== undefined) {
      dayIndex = (schedule.day_of_week + 6) % 7;
    } else if (schedule.target_date) {
      dayIndex = (new Date(schedule.target_date).getDay() + 6) % 7;
    }
 
    return {
      top,
      height,
      left: `${(dayIndex * 100) / 7}%`,
      width: `${100 / 7}%`,
      backgroundColor: schedule.color,
    };
  };
 
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const subLinesCount = 60 / grid_interval;
 
  return (
    <View style={styles.container}>
      {/* Day Header */}
      <View style={styles.dayHeader}>
        <View style={styles.hourColPlaceholder} />
        {weekDates.map((date, i) => {
          const isToday = isSameDay(date, today);
          return (
            <View key={i} style={[styles.dayLabel, isToday && styles.todayLabel]}>
              <Text style={[styles.dayText, isToday && styles.todayDayText]}>
                {format(date, 'E', { locale: ko })}
              </Text>
              <Text style={[styles.dateText, isToday && styles.todayDateText]}>
                {format(date, 'd')}
              </Text>
            </View>
          );
        })}
      </View>
 
      <ScrollView 
        style={styles.gridScroll} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
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
            {/* Background Vertical Grid Lines */}
            <View style={styles.verticalLinesContainer}>
              {Array.from({ length: 7 }).map((_, i) => (
                <View key={i} style={styles.verticalLine} />
              ))}
            </View>

            {/* Horizontal Grid Lines */}
            {hours.map((h, hIdx) => (
              <View key={h} style={styles.hourSlot}>
                {Array.from({ length: subLinesCount }).map((_, i) => {
                  const isLastHour = hIdx === hours.length - 1;
                  const isLastSubLine = i === subLinesCount - 1;
                  
                  return (
                    <View 
                      key={i} 
                      style={[
                        styles.gridLine, 
                        { height: HOUR_HEIGHT / subLinesCount },
                        i === 0 ? { borderTopWidth: 1, borderTopColor: COLORS.border + '70' } : { borderTopWidth: 1, borderTopColor: COLORS.border + '20', borderStyle: 'dashed' },
                        isLastHour && isLastSubLine && { borderBottomWidth: 1, borderBottomColor: COLORS.border + '70' }
                      ]} 
                    />
                  );
                })}
              </View>
            ))}
            
            {/* Schedule Blocks */}
            {schedules.map((s) => {
              const style = getScheduleStyle(s);
              if (style.top < 0 || style.top >= hours.length * HOUR_HEIGHT) return null;
              
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.scheduleBlock, 
                    { top: style.top, height: style.height, left: style.left as any, width: style.width as any },
                    s.is_routine && { zIndex: 5, opacity: 0.7 }
                  ]}
                  onPress={() => onPressSchedule?.(s)}
                >
                  <View style={[
                    styles.scheduleInner, 
                    { backgroundColor: style.backgroundColor },
                    s.is_routine && { borderStyle: 'dashed', borderWidth: 1 }
                  ]}>
                    <Text style={[styles.scheduleTitle, s.is_routine && { color: COLORS.text }]} numberOfLines={2}>
                      {s.title}
                    </Text>
                  </View>
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
    lineHeight: 12,
    color: COLORS.textSecondary,
    marginTop: -10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  slotsContainer: {
    flex: 1,
    position: 'relative',
  },
  verticalLinesContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  verticalLine: {
    flex: 1,
    borderLeftWidth: 0, // Make vertical lines invisible as requested
  },
  gridLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '20',
    borderLeftWidth: 0, // Make vertical lines invisible
  },
  scheduleBlock: {
    position: 'absolute',
    borderRadius: 4,
    zIndex: 10,
    marginHorizontal: 1, // Small margin for cleaner look
  },
  scheduleInner: {
    flex: 1,
    borderRadius: 3,
    padding: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  scheduleTitle: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: 'bold',
  },
});
