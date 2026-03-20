import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Schedule } from '../types';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 7;
const HOUR_HEIGHT = 60;

interface WeeklyGridProps {
  schedules: Schedule[];
  onPressSchedule?: (schedule: Schedule) => void;
}

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({ schedules, onPressSchedule }) => {
  const hours = [...Array(15)].map((_, i) => i + 8); // 8:00 to 22:00

  const getScheduleStyle = (schedule: Schedule) => {
    const [startH, startM] = schedule.start_time.split(':').map(Number);
    const [endH, endM] = schedule.end_time.split(':').map(Number);
    
    const top = (startH - 8) * HOUR_HEIGHT + (startM / 60) * HOUR_HEIGHT;
    const height = (endH - startH) * HOUR_HEIGHT + ((endM - startM) / 60) * HOUR_HEIGHT;
    const left = (schedule.day_of_week ?? 0) * COLUMN_WIDTH;

    return {
      top,
      height,
      left,
      width: COLUMN_WIDTH - 2,
      backgroundColor: schedule.color,
    };
  };

  return (
    <View style={styles.container}>
      {/* Day Labels */}
      <View style={styles.dayHeader}>
        <View style={styles.hourColPlaceholder} />
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <View key={i} style={styles.dayLabel}>
            <Text style={styles.dayText}>{day}</Text>
          </View>
        ))}
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
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  dayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
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
