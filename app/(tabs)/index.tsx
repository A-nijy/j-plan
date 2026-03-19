import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { CircularClock } from '../../src/components/CircularClock';
import { ScheduleService } from '../../src/services/ScheduleService';
import { Schedule } from '../../src/types';
import { Plus } from 'lucide-react-native';
import { format } from 'date-fns';

export default function TodayScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      let data = await ScheduleService.getSchedulesForDate(today);
      if (data.length === 0) {
        // Create dummy data for testing
        await ScheduleService.createSchedule({
          title: '잠',
          start_time: '00:00',
          end_time: '07:00',
          color: '#94A3B8',
          day_of_week: new Date().getDay(),
        });
        await ScheduleService.createSchedule({
          title: '운동',
          start_time: '07:30',
          end_time: '09:00',
          color: COLORS.chart[0],
          day_of_week: new Date().getDay(),
        });
        await ScheduleService.createSchedule({
          title: '업무',
          start_time: '10:00',
          end_time: '18:00',
          color: COLORS.chart[1],
          day_of_week: new Date().getDay(),
        });
        data = await ScheduleService.getSchedulesForDate(today);
      }
      setSchedules(data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  };

  const chartData = schedules.map(s => ({
    startHour: timeToFloat(s.start_time),
    endHour: timeToFloat(s.end_time),
    color: s.color,
    label: s.title,
  }));

  function timeToFloat(timeStr: string) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.clockContainer}>
          <CircularClock data={chartData} />
        </View>
        
        <View style={styles.listContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>오늘의 일정</Text>
            <TouchableOpacity style={styles.addButton}>
              <Plus color={COLORS.surface} size={20} />
            </TouchableOpacity>
          </View>
          
          {schedules.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>오늘 등록된 일정이 없습니다.</Text>
            </View>
          ) : (
            schedules.map((item) => (
              <View key={item.id} style={styles.scheduleItem}>
                <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleTitle}>{item.title}</Text>
                  <Text style={styles.scheduleTime}>
                    {item.start_time} - {item.end_time}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  clockContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    marginTop: SPACING.md,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  colorIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: SPACING.md,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  scheduleTime: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
