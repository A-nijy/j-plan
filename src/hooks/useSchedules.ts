import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { ScheduleService } from '../services/ScheduleService';
import { RoutineService } from '../services/RoutineService';
import { Schedule } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSchedules = (dateStr: string) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [hasDeletedRoutines, setHasDeletedRoutines] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const checkDeletedRoutines = useCallback(async () => {
    try {
      const deleted = await RoutineService.getDeletedRoutinesForDate(dateStr);
      setHasDeletedRoutines(deleted.length > 0);
    } catch (error) {
      console.error('Failed to check deleted routines:', error);
    }
  }, [dateStr]);

  const loadSchedules = useCallback(async () => {
    try {
      const data = await ScheduleService.getSchedulesForDate(dateStr);
      setSchedules(data);
      checkDeletedRoutines();
      
      if (data.length > 0) {
        const seen = await AsyncStorage.getItem('tooltip_seen_swipe');
        if (!seen) setShowTooltip(true);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  }, [dateStr, checkDeletedRoutines]);

  const handleSaveSchedule = useCallback(async (newSchedule: any, initialValues: any) => {
    try {
      if (initialValues?.id) {
        if (initialValues.is_routine) {
          const templateId = initialValues.id.split('::')[1];
          await ScheduleService.excludeRoutineFromDate(templateId, dateStr);
        } else {
          await ScheduleService.deleteScheduleAtDate(initialValues.id);
        }
      }

      await ScheduleService.createSchedule(newSchedule);
      await loadSchedules();
      return true;
    } catch (error) {
      Alert.alert('오류', '일정을 저장하지 못했습니다.');
      return false;
    }
  }, [dateStr, loadSchedules]);

  const handleDeleteSchedule = useCallback(async (schedule: Schedule) => {
    try {
      if (schedule.is_routine) {
        const templateId = schedule.id.split('::')[1];
        await ScheduleService.excludeRoutineFromDate(templateId, dateStr);
      } else {
        await ScheduleService.deleteScheduleAtDate(schedule.id);
      }
      await loadSchedules();
      return true;
    } catch (error) {
      Alert.alert('오류', '삭제하지 못했습니다.');
      return false;
    }
  }, [dateStr, loadSchedules]);

  const toggleCompletion = useCallback(async (schedule: Schedule) => {
    try {
      await ScheduleService.toggleScheduleCompletion(
        schedule.id,
        dateStr,
        !!schedule.is_routine,
        !!schedule.is_completed
      );
      await loadSchedules();
    } catch (error) {
      Alert.alert('오류', '상태를 변경하지 못했습니다.');
    }
  }, [dateStr, loadSchedules]);

  const progressPercentage = useMemo(() => {
    const totalCount = schedules.length;
    if (totalCount === 0) return 0;
    const completedCount = schedules.filter(s => s.is_completed).length;
    return Math.round((completedCount / totalCount) * 100);
  }, [schedules]);

  const chartData = useMemo(() => {
    const parseTime = (timeStr: string, isEnd = false) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (isEnd && hours === 0 && minutes === 0) return 24.0;
      return hours + minutes / 60;
    };

    return schedules.map(s => ({
      startHour: parseTime(s.start_time),
      endHour: parseTime(s.end_time, true),
      color: s.color,
      label: s.title,
    }));
  }, [schedules]);

  return {
    schedules,
    hasDeletedRoutines,
    showTooltip,
    setShowTooltip,
    loadSchedules,
    handleSaveSchedule,
    handleDeleteSchedule,
    toggleCompletion,
    progressPercentage,
    chartData,
  };
};
