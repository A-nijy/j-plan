import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, FlatList, Dimensions } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { WeeklyGrid } from '../../src/components/WeeklyGrid';
import { ScheduleService } from '../../src/services/ScheduleService';
import { Schedule } from '../../src/types';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react-native';
import { startOfWeek, format, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import AddScheduleModal from '../../src/components/AddScheduleModal';
import { WeeklySettingsService, WeeklySettings } from '../../src/services/WeeklySettingsService';
import { WeeklySettingsModal } from '../../src/components/WeeklySettingsModal';

export default function WeeklyScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settings, setSettings] = useState<WeeklySettings | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const today = new Date();
  
  useEffect(() => {
    loadSettings();
    loadWeeklySchedules();
  }, [currentWeekStart]);

  const loadSettings = async () => {
    const data = await WeeklySettingsService.getSettings();
    setSettings(data);
  };

  const loadWeeklySchedules = async () => {
    try {
      const allSchedules: Schedule[] = [];
      for (let i = 0; i < 7; i++) {
        const date = format(addDays(currentWeekStart, i), 'yyyy-MM-dd');
        const daySchedules = await ScheduleService.getSchedulesForDate(date);
        allSchedules.push(...daySchedules);
      }
      setSchedules(allSchedules);
    } catch (error) {
      console.error('Failed to load weekly schedules:', error);
    }
  };

  const moveWeek = (direction: number) => {
    setCurrentWeekStart(prev => addDays(prev, direction * 7));
  };

  const moveMonth = (direction: number) => {
    setCurrentWeekStart(prev => startOfWeek(addDays(startOfMonth(prev), direction * 31), { weekStartsOn: 1 }));
  };

  const renderMonthlyCalendar = () => {
    if (settings?.view_mode !== 'combined') return null;

    const monthStart = startOfMonth(currentWeekStart);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start for monthly grid
    const endDate = endOfMonth(monthEnd);
    // Ensure we cover full weeks
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: 0 }), 6);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <View style={styles.calendarGridContainer}>
        <View style={styles.calendarGridHeader}>
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <Text key={i} style={[styles.gridHeaderText, i === 0 && { color: '#FFADAD' }, i === 6 && { color: '#A0C4FF' }]}>
              {d}
            </Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {days.map((date, i) => {
            const isCurrentMonth = isSameMonth(date, monthStart);
            const isSelectedWeek = isSameDay(date, currentWeekStart) || 
                                   (date >= currentWeekStart && date < addDays(currentWeekStart, 7));
            const isToday = isSameDay(date, today);

            return (
              <TouchableOpacity 
                key={i} 
                style={[
                  styles.dayCell, 
                  isSelectedWeek && styles.selectedWeekCell,
                  isToday && styles.todayCell
                ]}
                onPress={() => {
                  setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
                  setSelectedDay(date.getDay());
                }}
              >
                <Text style={[
                  styles.dayCellText, 
                  !isCurrentMonth && styles.otherMonthText,
                  isSelectedWeek && styles.selectedWeekText,
                  isToday && styles.todayCellText
                ]}>
                  {format(date, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
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
      await ScheduleService.createSchedule(newSchedule);
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
      <View style={styles.calendarNav}>
        <View>
          <Text style={styles.yearText}>{format(currentWeekStart, 'yyyy년')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.monthText}>{format(currentWeekStart, 'MMMM', { locale: ko })}</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(true)}>
              <Settings color={COLORS.textSecondary} size={18} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.navButtons}>
          <TouchableOpacity style={styles.navBtn} onPress={() => moveWeek(-1)}>
            <ChevronLeft color={COLORS.text} size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.todayBtn} onPress={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            <Text style={styles.todayBtnText}>이번 주</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => moveWeek(1)}>
            <ChevronRight color={COLORS.text} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {renderMonthlyCalendar()}

      {settings && (
        <WeeklyGrid 
          schedules={schedules} 
          onPressSchedule={(s) => handleDeleteSchedule(s.id)}
          startDate={currentWeekStart}
          settings={settings}
        />
      )}
      
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
        showDatePicker={true}
        initialDate={format(addDays(currentWeekStart, (selectedDay + 6) % 7), 'yyyy-MM-dd')}
      />

      {settings && (
        <WeeklySettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          settings={settings}
          onSave={loadSettings}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  yearText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  monthText: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  navBtn: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  todayBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + '15',
  },
  todayBtnText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  calendarGridContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  calendarGridHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  gridHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (Dimensions.get('window').width - SPACING.md * 2) / 7,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  dayCellText: {
    fontSize: 13,
    color: COLORS.text,
  },
  otherMonthText: {
    color: COLORS.border,
  },
  selectedWeekCell: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 0,
  },
  selectedWeekText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  todayCell: {
    backgroundColor: COLORS.primary,
  },
  todayCellText: {
    color: COLORS.surface,
    fontWeight: 'bold',
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
