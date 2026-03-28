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
 
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getScheduleStyle = (schedule: Schedule) => {
    const [startH, startM] = schedule.start_time.split(':').map(Number);
    let [endH, endM] = schedule.end_time.split(':').map(Number);
    
    // Normalize end time: 00:00 -> 24:00 if it's at the end of the day
    if (endH === 0 && endM === 0 && startH > 0) {
      endH = 24;
    }
    
    const top = (startH - start_hour) * HOUR_HEIGHT + (startM / 60) * HOUR_HEIGHT;
    const height = (endH - startH) * HOUR_HEIGHT + ((endM - startM) / 60) * HOUR_HEIGHT;
    
    return {
      top,
      height,
      backgroundColor: schedule.color,
    };
  };

  const getSchedulesForDay = (dayIndex: number) => {
    return schedules.filter(s => {
      if (s.day_of_week !== null && s.day_of_week !== undefined) {
        return ((s.day_of_week + 6) % 7) === dayIndex;
      } else if (s.target_date) {
        return (new Date(s.target_date).getDay() + 6) % 7 === dayIndex;
      }
      return false;
    });
  };
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
            {/* Horizontal Grid Lines */}
            <View style={styles.horizontalLinesLayer}>
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
            </View>

            {/* Vertical Columns and Schedules */}
            <View style={styles.columnsContainer}>
              {weekDates.map((_, dayIndex) => (
                <View key={dayIndex} style={styles.dayColumn}>
                  {getSchedulesForDay(dayIndex).map((s) => {
                    const style = getScheduleStyle(s);
                    if (style.top < 0 || style.top >= hours.length * HOUR_HEIGHT) return null;
                    
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[
                          styles.scheduleBlock, 
                          { top: style.top, height: style.height },
                          s.is_routine && { zIndex: 5, opacity: 0.7 }
                        ]}
                        onPress={() => onPressSchedule?.(s)}
                      >
                        <View style={[
                          styles.scheduleInner, 
                          { backgroundColor: style.backgroundColor },
                          s.is_routine && { borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
                          s.is_completed && { borderWidth: 2.5, borderColor: 'rgba(0,0,0,0.4)', borderStyle: 'solid' }
                        ]}>
                          <Text style={[styles.scheduleTitle, s.is_routine && { color: COLORS.text }]} numberOfLines={2}>
                            {s.title}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
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
  },
  horizontalLinesLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  columnsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  dayColumn: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border + '50',
    position: 'relative',
  },
  gridLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '20',
  },
  scheduleBlock: {
    position: 'absolute',
    left: 1,
    right: 1,
    borderRadius: 4,
    zIndex: 10,
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
