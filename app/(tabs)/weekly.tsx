import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING } from '../../src/constants/theme';
import { WeeklyGrid } from '../../src/components/WeeklyGrid';
import { ScheduleService } from '../../src/services/ScheduleService';
import { Schedule } from '../../src/types';
import { startOfWeek, format, addDays } from 'date-fns';
import AddScheduleModal from '../../src/components/AddScheduleModal';

export default function WeeklyScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });

  useEffect(() => {
    loadWeeklySchedules();
  }, []);

  const loadWeeklySchedules = async () => {
    try {
      const allSchedules: Schedule[] = [];
      for (let i = 0; i < 7; i++) {
        const date = format(addDays(start, i), 'yyyy-MM-dd');
        const daySchedules = await ScheduleService.getSchedulesForDate(date);
        allSchedules.push(...daySchedules);
      }
      setSchedules(allSchedules);
    } catch (error) {
      console.error('Failed to load weekly schedules:', error);
    }
  };

  const handleAddSchedule = async (newSchedule: any) => {
    try {
      await ScheduleService.createSchedule({
        ...newSchedule,
        day_of_week: selectedDay,
      });
      setModalVisible(false);
      loadWeeklySchedules();
    } catch (error) {
      Alert.alert('오류', '일정을 저장하지 못했습니다.');
    }
  };

  const handleDeleteSchedule = (id: string) => {
    Alert.alert('일정 삭제', '정말로 이 일정을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { 
        text: '삭제', 
        style: 'destructive',
        onPress: async () => {
          await ScheduleService.deleteSchedule(id);
          loadWeeklySchedules();
        }
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <WeeklyGrid 
        schedules={schedules} 
        onPressSchedule={(s) => handleDeleteSchedule(s.id)}
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          setSelectedDay(new Date().getDay());
          setModalVisible(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddScheduleModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddSchedule}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
    color: COLORS.surface,
    fontWeight: 'bold',
  },
});
