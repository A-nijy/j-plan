import React, { useState, useCallback, useMemo, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, InteractionManager } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { CircularClock } from '../../src/components/CircularClock';
import { Schedule } from '../../src/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, Eye, EyeOff, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react-native';
import AddScheduleModal from '../../src/components/AddScheduleModal';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScheduleDetailModal } from '../../src/components/ScheduleDetailModal';
import RestoreRoutineModal from '../../src/components/RestoreRoutineModal';
import { SeedService } from '../../src/services/SeedService';
import { useTheme } from '../../src/context/ThemeContext';
import { useDateNavigation } from '../../src/hooks/useDateNavigation';
import { useSchedules } from '../../src/hooks/useSchedules';
import { useTodaySettings } from '../../src/hooks/useTodaySettings';
import ScheduleItem from '../../src/components/ScheduleItem';

export default function TodayScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  // Custom Hooks
  const { selectedDate, dateStr, moveDate, setSelectedDate } = useDateNavigation();
  const { settings, loadSettings, toggleClock } = useTodaySettings();
  const {
    schedules,
    hasDeletedRoutines,
    showTooltip,
    setShowTooltip,
    loadSchedules,
    handleSaveSchedule,
    handleDeleteSchedule,
    toggleCompletion,
    progressPercentage,
    chartData
  } = useSchedules(dateStr);

  // UI States (Modals)
  const [modalVisible, setModalVisible] = useState(false);
  const [initialValues, setInitialValues] = useState<any>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [restoreVisible, setRestoreVisible] = useState(false);

  // 1. Optimize data loading with InteractionManager
  // Defer heavy DB operations until navigation animations are finished
  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        loadSettings();
        loadSchedules();
      });
      return () => task.cancel();
    }, [loadSettings, loadSchedules])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={[
            styles.seedButton, 
            { backgroundColor: colors.error + '15', borderColor: colors.error }
          ]}
          onPress={async () => {
            const success = await SeedService.seedTestData();
            if (success) {
              Alert.alert('성공', '테스트 데이터가 생성되었습니다.');
              loadSchedules();
            }
          }}
        >
          <Text style={[styles.seedButtonText, { color: colors.error }]}>SEED</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, loadSchedules]);

  // 2. Memoized Callback Handlers to prevent ScheduleItem re-renders
  const handleItemPress = useCallback((schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setDetailVisible(true);
  }, []);

  const handleItemDelete = useCallback(async (schedule: Schedule) => {
    const success = await handleDeleteSchedule(schedule);
    if (success && detailVisible) setDetailVisible(false);
  }, [handleDeleteSchedule, detailVisible]);

  const handleItemToggle = useCallback((schedule: Schedule) => {
    toggleCompletion(schedule);
  }, [toggleCompletion]);

  const onSaveSchedule = async (newSchedule: any) => {
    const success = await handleSaveSchedule(newSchedule, initialValues);
    if (success) {
      setModalVisible(false);
      setInitialValues(null);
    }
  };

  const onEditSchedule = (schedule: Schedule) => {
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

  // 3. Extracted Header for FlatList
  const ListHeader = useMemo(() => (
    <View style={styles.headerContainer}>
      {settings?.show_circular_clock === 1 && (
        <View style={styles.clockContainer}>
          <CircularClock data={chartData} progress={progressPercentage} />
        </View>
      )}
      
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.dateNav}>
            <TouchableOpacity style={styles.navBtn} onPress={() => moveDate(-1)}>
              <ChevronLeft color={colors.text} size={22} />
            </TouchableOpacity>
            <View style={styles.dateLabelContainer}>
              <Text style={[styles.dateText, { color: colors.text }]}>
                {format(selectedDate, 'M월 d일 (E)', { locale: ko })}
              </Text>
            </View>
            <TouchableOpacity style={styles.navBtn} onPress={() => moveDate(1)}>
              <ChevronRight color={colors.text} size={22} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.todayBtn, { backgroundColor: colors.primary + '15' }]} 
            onPress={() => setSelectedDate(new Date())}
          >
            <Text style={[styles.todayBtnText, { color: colors.primary }]}>오늘</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerButtons}>
          {hasDeletedRoutines && (
            <TouchableOpacity 
              style={[styles.restoreHeaderButton, { backgroundColor: colors.primary + '15' }]}
              onPress={() => setRestoreVisible(true)}
            >
              <RotateCcw color={colors.primary} size={20} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={toggleClock}
          >
            {settings?.show_circular_clock === 1 ? (
              <EyeOff color={colors.textSecondary} size={20} />
            ) : (
              <Eye color={colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setInitialValues(null);
              setModalVisible(true);
            }}
          >
            <Plus color={colors.surface} size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [settings, chartData, progressPercentage, colors, selectedDate, moveDate, setSelectedDate, hasDeletedRoutines, toggleClock]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={schedules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ScheduleItem 
            item={item}
            colors={colors}
            onPress={handleItemPress}
            onDelete={handleItemDelete}
            onToggle={handleItemToggle}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>오늘 등록된 일정이 없습니다.</Text>
          </View>
        }
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews={true} // Performance optimization for large lists
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
      />

      <AddScheduleModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setInitialValues(null);
        }}
        onSave={onSaveSchedule}
        showDatePicker={false}
        initialDate={dateStr}
        initialValues={initialValues}
      />

      <ScheduleDetailModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        schedule={selectedSchedule}
        onDelete={async (item) => {
          await handleItemDelete(item);
        }}
        onEdit={onEditSchedule}
        onToggleCompletion={async (item) => {
          await handleItemToggle(item);
          setSelectedSchedule(prev => prev ? { ...prev, is_completed: !prev.is_completed } : null);
        }}
      />

      <RestoreRoutineModal
        visible={restoreVisible}
        onClose={() => setRestoreVisible(false)}
        date={dateStr}
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
  },
  headerContainer: {
    marginBottom: SPACING.md,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 120, // Space for potential floating buttons or bottom bar
  },
  clockContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabelContainer: {
    paddingHorizontal: SPACING.xs,
    minWidth: 110,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  navBtn: {
    padding: 4,
  },
  todayBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  settingsButton: {
    padding: 4,
  },
  restoreHeaderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seedButton: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: SPACING.md,
  },
  seedButtonText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  emptyText: {
    fontSize: 14,
  },
});
