import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { CircularClock } from '../../src/components/CircularClock';
import { ScheduleService } from '../../src/services/ScheduleService';
import { Schedule } from '../../src/types';
import { Plus, Eye, EyeOff, Check, RotateCcw } from 'lucide-react-native';
import { format } from 'date-fns';
import AddScheduleModal from '../../src/components/AddScheduleModal';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { WeeklySettings, WeeklySettingsService } from '../../src/services/WeeklySettingsService';
import { ScheduleDetailModal } from '../../src/components/ScheduleDetailModal';
import { RoutineService } from '../../src/services/RoutineService';
import RestoreRoutineModal from '../../src/components/RestoreRoutineModal';
import { SeedService } from '../../src/services/SeedService';
import SwipeableRow from '../../src/components/common/SwipeableRow';
import OnboardingTooltip from '../../src/components/common/OnboardingTooltip';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TodayScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [initialValues, setInitialValues] = useState<any>(null);
  const [settings, setSettings] = useState<WeeklySettings | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [restoreVisible, setRestoreVisible] = useState(false);
  const [hasDeletedRoutines, setHasDeletedRoutines] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const loadSettings = async () => {
    const data = await WeeklySettingsService.getSettings();
    setSettings(data);
  };

  const toggleClock = async () => {
    if (!settings) return;
    const newShowClock = settings.show_circular_clock === 1 ? 0 : 1;
    await WeeklySettingsService.updateSettings({ show_circular_clock: newShowClock });
    await loadSettings();
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      loadSchedules();
      checkDeletedRoutines();
      checkTooltip();
    }, [])
  );

  const checkTooltip = async () => {
    const seen = await AsyncStorage.getItem('tooltip_seen_swipe');
    if (!seen) {
      // Show tooltip if there's at least one item
      // We'll trigger this inside loadSchedules after data is fetched
    }
  };

  const checkDeletedRoutines = async () => {
    try {
      const deleted = await RoutineService.getDeletedRoutinesForDate(today);
      setHasDeletedRoutines(deleted.length > 0);
    } catch (error) {
      console.error('Failed to check deleted routines:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      const data = await ScheduleService.getSchedulesForDate(today);
      setSchedules(data);
      checkDeletedRoutines();
      
      // Handle tooltip visibility
      if (data.length > 0) {
        const seen = await AsyncStorage.getItem('tooltip_seen_swipe');
        if (!seen) setShowTooltip(true);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  };

  const handleAddSchedule = async (newSchedule: {
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    color: string;
    target_date: string;
  }) => {
    try {
      // If we are editing (initialValues present)
      if (initialValues?.id) {
        if (initialValues.is_routine) {
          // Change Routine Only Today: 
          // 1. Exclude old routine for today
          const templateId = initialValues.id.split('::')[1];
          await ScheduleService.excludeRoutineFromDate(templateId, today);
          // 2. Create new regular schedule (below)
        } else {
          // Regular schedule edit: Delete old one first
          await ScheduleService.deleteScheduleAtDate(initialValues.id);
        }
      }

      await ScheduleService.createSchedule(newSchedule);
      setModalVisible(false);
      setInitialValues(null);
      loadSchedules();
    } catch (error) {
      Alert.alert('오류', '일정을 저장하지 못했습니다.');
    }
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setDetailVisible(false);
    setInitialValues({
      id: schedule.id,
      title: schedule.title,
      description: schedule.description || '',
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      color: schedule.color,
      is_routine: schedule.is_routine,
    });
    setModalVisible(true);
  };

  const handlePressSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setDetailVisible(true);
  };

  const handleDeleteSchedule = async (schedule: Schedule) => {
    try {
      if (schedule.is_routine) {
        const templateId = schedule.id.split('::')[1];
        await ScheduleService.excludeRoutineFromDate(templateId, today);
      } else {
        await ScheduleService.deleteScheduleAtDate(schedule.id);
      }
      setDetailVisible(false);
      loadSchedules();
    } catch (error) {
      Alert.alert('오류', '삭제하지 못했습니다.');
    }
  };

  function timeToFloat(timeStr: string, isEnd: boolean = false) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isEnd && hours === 0 && minutes === 0) return 24.0;
    return hours + minutes / 60;
  }

  const toggleCompletion = async (schedule: Schedule) => {
    try {
      await ScheduleService.toggleScheduleCompletion(
        schedule.id,
        today,
        !!schedule.is_routine,
        !!schedule.is_completed
      );
      loadSchedules();
    } catch (error) {
      Alert.alert('오류', '상태를 변경하지 못했습니다.');
    }
  };

  const completedCount = schedules.filter(s => s.is_completed).length;
  const totalCount = schedules.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const chartData = schedules.map(s => ({
    startHour: timeToFloat(s.start_time),
    endHour: timeToFloat(s.end_time, true),
    color: s.color,
    label: s.title,
  }));

  return (
    <View style={styles.container}>
      <OnboardingTooltip 
        type="swipe" 
        visible={showTooltip} 
        onClose={() => setShowTooltip(false)} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {settings?.show_circular_clock === 1 && (
          <View style={styles.clockContainer}>
            <CircularClock data={chartData} progress={progressPercentage} />
          </View>
        )}
        
        <View style={styles.listContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>오늘의 일정</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.seedButton}
                onPress={async () => {
                  const success = await SeedService.seedTestData();
                  if (success) {
                    Alert.alert('성공', '테스트 데이터가 생성되었습니다. 앱을 재시작하거나 화면을 새로고침해주세요.');
                    loadSchedules();
                  }
                }}
              >
                <Text style={styles.seedButtonText}>SEED</Text>
              </TouchableOpacity>
              {hasDeletedRoutines && (
                <TouchableOpacity 
                  style={styles.restoreHeaderButton}
                  onPress={() => setRestoreVisible(true)}
                >
                  <RotateCcw color={COLORS.primary} size={20} />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={toggleClock}
              >
                {settings?.show_circular_clock === 1 ? (
                  <EyeOff color={COLORS.textSecondary} size={20} />
                ) : (
                  <Eye color={COLORS.textSecondary} size={20} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => {
                  setInitialValues(null);
                  setModalVisible(true);
                }}
              >
                <Plus color={COLORS.surface} size={20} />
              </TouchableOpacity>
            </View>
          </View>
          
          {schedules.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>오늘 등록된 일정이 없습니다.</Text>
            </View>
          ) : (
            schedules.map((item) => (
              <SwipeableRow
                key={item.id}
                onDelete={() => handleDeleteSchedule(item)}
                onPress={() => handlePressSchedule(item)}
              >
                <View style={[styles.scheduleItem, { marginBottom: 0 }]}>
                  <View style={[styles.colorBar, { backgroundColor: item.color }]} />
                  <View style={styles.scheduleCardContent}>
                    <View style={styles.scheduleInfo}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.scheduleTitle, item.is_completed && styles.completedText]}>
                          {item.title}
                        </Text>
                        {item.is_routine && (
                          <View style={styles.routineBadge}>
                            <Text style={styles.routineBadgeText}>루틴</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.scheduleTime, item.is_completed && styles.completedText]}>
                        {item.start_time} - {item.end_time}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={[styles.checkbox, item.is_completed && { backgroundColor: item.color, borderColor: item.color }]}
                      onPress={() => toggleCompletion(item)}
                    >
                      {item.is_completed && <Check size={14} color="white" strokeWidth={3} />}
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ height: SPACING.sm }} />
              </SwipeableRow>
            ))
          )}
        </View>
      </ScrollView>

      <AddScheduleModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setInitialValues(null);
        }}
        onSave={handleAddSchedule}
        showDatePicker={false}
        initialDate={today}
        initialValues={initialValues}
      />

      <ScheduleDetailModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        schedule={selectedSchedule}
        onDelete={handleDeleteSchedule}
        onEdit={handleEditSchedule}
      />

      <RestoreRoutineModal
        visible={restoreVisible}
        onClose={() => setRestoreVisible(false)}
        date={today}
        onRestored={() => {
          loadSchedules();
        }}
      />
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
    paddingBottom: 120, // Increased for safe area
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingsButton: {
    padding: SPACING.xs,
  },
  restoreHeaderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seedButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: COLORS.error + '15',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  seedButtonText: {
    fontSize: 10,
    color: COLORS.error,
    fontWeight: 'bold',
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
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  colorBar: {
    width: 6,
  },
  scheduleCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginLeft: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  scheduleInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  routineBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  routineBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  scheduleTime: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
