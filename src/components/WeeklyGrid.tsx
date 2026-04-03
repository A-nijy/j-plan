import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import { Schedule } from '../types';
import { useTheme } from '../context/ThemeContext';

const HOUR_HEIGHT = 60;
 
import { startOfWeek, format, addDays, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { WeeklySettings } from '../services/WeeklySettingsService';
 
const isLightColor = (hex: string) => {
  if (!hex || hex.length < 6) return false;
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155; 
};

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex || hex.length < 6) return hex;
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface WeeklyGridProps {
  schedules: Schedule[];
  onPressSchedule?: (schedule: Schedule) => void;
  startDate?: Date;
  settings: WeeklySettings;
}
 
export const WeeklyGrid: React.FC<WeeklyGridProps> = ({ schedules, onPressSchedule, startDate = new Date(), settings }) => {
  const { colors } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Day Header */}
      <View style={[styles.dayHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.hourColPlaceholder} />
        {weekDates.map((date, i) => {
          const isToday = isSameDay(date, today);
          return (
            <View key={i} style={[
              styles.dayLabel, 
              { borderLeftColor: colors.border },
              isToday && { backgroundColor: colors.primary + '15' }
            ]}>
              <Text style={[styles.dayText, { color: colors.textSecondary }, isToday && { color: colors.primary }]}>
                {format(date, 'E', { locale: ko })}
              </Text>
              <Text style={[styles.dateText, { color: colors.text }, isToday && { color: colors.primary, fontWeight: 'bold' }]}>
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
          <View style={[styles.hourColumn, { backgroundColor: colors.background }]}>
            {hours.map((h) => (
              <View key={h} style={styles.hourCell}>
                <Text style={[styles.hourText, { color: colors.textSecondary }]}>{h}:00</Text>
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
                          { height: HOUR_HEIGHT / subLinesCount, borderBottomColor: colors.border + '20' },
                          i === 0 ? { borderTopWidth: 1, borderTopColor: colors.border + '70' } : { borderTopWidth: 1, borderTopColor: colors.border + '20', borderStyle: 'dashed' },
                          isLastHour && isLastSubLine && { borderBottomWidth: 1, borderBottomColor: colors.border + '70' }
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
                <View key={dayIndex} style={[styles.dayColumn, { borderLeftColor: colors.border + '50' }]}>
                  {getSchedulesForDay(dayIndex).map((s) => {
                    const style = getScheduleStyle(s);
                    if (style.top < 0 || style.top >= hours.length * HOUR_HEIGHT) return null;
                    
                    return (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.scheduleBlock, 
                            { top: style.top, height: style.height },
                            s.is_routine && { zIndex: 5 }
                          ]}
                          onPress={() => onPressSchedule?.(s)}
                        >
                          <View style={[
                            styles.scheduleInner, 
                            { backgroundColor: s.is_routine ? hexToRgba(style.backgroundColor, 0.7) : style.backgroundColor },
                          s.is_routine && { borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
                          s.is_completed && { borderWidth: 2.5, borderColor: 'rgba(0,0,0,0.4)', borderStyle: 'solid' }
                        ]}>
                          <Text 
                            style={[
                              styles.scheduleTitle, 
                              { color: isLightColor(style.backgroundColor) ? '#000' : '#FFF' }
                            ]} 
                            numberOfLines={2}
                          >
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
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  hourColPlaceholder: {
    width: 50,
  },
  dayLabel: {
    flex: 1,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    borderLeftWidth: 1,
  },
  dayText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  gridScroll: {
    flex: 1,
  },
  gridBody: {
    flexDirection: 'row',
  },
  hourColumn: {
    width: 50,
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
    position: 'relative',
  },
  gridLine: {
    borderBottomWidth: 1,
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
    fontWeight: 'bold',
  },
});
