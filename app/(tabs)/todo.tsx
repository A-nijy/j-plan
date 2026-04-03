import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, FlatList, Alert } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { TodoService } from '../../src/services/TodoService';
import { Todo } from '../../src/types';
import { CheckCircle2, Circle, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';
import { format, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import AddTodoModal from '../../src/components/AddTodoModal';
import HabitHistoryModal from '../../src/components/HabitHistoryModal';
import { TodoDetailModal } from '../../src/components/TodoDetailModal';
import { Flame } from 'lucide-react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import SwipeableRow from '../../src/components/common/SwipeableRow';
import OnboardingTooltip from '../../src/components/common/OnboardingTooltip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/context/ThemeContext';

export default function TodoScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<'habit' | 'daily'>('habit');
  const [todos, setTodos] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<{ id: string; content: string; description?: string } | undefined>(undefined);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistoryTodo, setSelectedHistoryTodo] = useState<any>(null);
  const [selectedDetailTodo, setSelectedDetailTodo] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSwipeTooltip, setShowSwipeTooltip] = useState(false);
  const [showDragTooltip, setShowDragTooltip] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    loadTodos();
  }, [tab, dateStr]);

  const loadTodos = async () => {
    try {
      const data = await TodoService.getTodos(tab, dateStr);
      setTodos(data);
      
      if (data.length > 0) {
        const seenSwipe = await AsyncStorage.getItem('tooltip_seen_swipe');
        const seenDrag = await AsyncStorage.getItem('tooltip_seen_drag');
        if (!seenSwipe) setShowSwipeTooltip(true);
        else if (!seenDrag) setShowDragTooltip(true);
      }
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  };

  const moveDate = (offset: number) => {
    setSelectedDate(prev => offset > 0 ? addDays(prev, offset) : subDays(prev, -offset));
  };

  const handleSaveTodo = async (todoData: any) => {
    try {
      if (todoData.id) {
        await TodoService.updateTodo(todoData.id, todoData.content, todoData.description, dateStr);
      } else {
        await TodoService.createTodo({
          ...todoData,
          is_completed: 0,
          target_date: tab === 'daily' ? dateStr : null,
          habit_days: tab === 'habit' ? '1,2,3,4,5,6,0' : null,
        }, dateStr);
      }
      loadTodos();
      setEditingTodo(undefined);
    } catch (error) {
      Alert.alert('오류', '데이터를 저장하지 못했습니다.');
    }
  };

  const handleToggle = async (id: string, currentStatus: number) => {
    try {
      await TodoService.toggleTodo(id, dateStr, currentStatus === 0);
      loadTodos();
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await TodoService.deleteTodo(id);
      loadTodos();
    } catch (error) {
      Alert.alert('오류', '삭제하지 못했습니다.');
    }
  };

  const handlePressItem = (item: any) => {
    setSelectedDetailTodo(item);
    setDetailVisible(true);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<any>) => (
    <ScaleDecorator>
      <SwipeableRow
        onDelete={() => handleDeleteTodo(item.id)}
      >
        <TouchableOpacity 
          style={[
            styles.todoItem, 
            { backgroundColor: colors.surface },
            isActive && { backgroundColor: colors.background, elevation: 5 },
            { marginBottom: 0 }
          ]} 
          onPress={() => handlePressItem(item)}
          onLongPress={drag}
          delayLongPress={200}
        >
          <View style={styles.todoLeft}>
            <TouchableOpacity onPress={() => handleToggle(item.id, item.is_completed)}>
              {item.is_completed === 1 ? (
                <CheckCircle2 color={colors.primary} size={24} />
              ) : (
                <Circle color={colors.textSecondary} size={24} />
              )}
            </TouchableOpacity>
            <Text style={[styles.todoText, { color: colors.text }, item.is_completed === 1 && styles.completedText]}>
              {item.content}
            </Text>
          </View>

          {tab === 'habit' && (
            <TouchableOpacity 
              style={[styles.streakBadge, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => {
                setSelectedHistoryTodo(item);
                setHistoryModalVisible(true);
              }}
            >
              <Flame size={14} color={item.streak > 0 ? '#FF8B3D' : colors.textSecondary} style={{ marginRight: 2 }} />
              <Text style={[styles.streakText, { color: colors.textSecondary }, item.streak > 0 && { color: '#FF8B3D' }]}>{item.streak}</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </SwipeableRow>
      <View style={{ height: SPACING.sm }} />
    </ScaleDecorator>
  );

  const completedCount = todos.filter(t => t.is_completed === 1).length;
  const totalCount = todos.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <OnboardingTooltip 
        type="swipe" 
        visible={showSwipeTooltip} 
        onClose={() => setShowSwipeTooltip(false)} 
      />
      <OnboardingTooltip 
        type="drag" 
        visible={showDragTooltip} 
        onClose={() => setShowDragTooltip(false)} 
      />
      <View style={[styles.controlRegion, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={[styles.todayBtn, { backgroundColor: colors.primary + '15' }]} 
            onPress={() => setSelectedDate(new Date())}
          >
            <Text style={[styles.todayBtnText, { color: colors.primary }]}>오늘</Text>
          </TouchableOpacity>

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

          <View style={styles.compactProgress}>
            <Text style={[styles.progressValue, { color: colors.primary }]}>{progressPercentage}%</Text>
          </View>
        </View>

        <View style={styles.tabWrapper}>
          <View style={[styles.segmentedControl, { backgroundColor: colors.background }]}>
            <TouchableOpacity 
              style={[styles.segmentBtn, tab === 'habit' && [styles.activeSegment, { backgroundColor: colors.surface }]]} 
              onPress={() => setTab('habit')}
            >
              <Text style={[styles.segmentText, { color: colors.textSecondary }, tab === 'habit' && { color: colors.primary, fontWeight: 'bold' }]}>매일 습관</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segmentBtn, tab === 'daily' && [styles.activeSegment, { backgroundColor: colors.surface }]]} 
              onPress={() => setTab('daily')}
            >
              <Text style={[styles.segmentText, { color: colors.textSecondary }, tab === 'daily' && { color: colors.primary, fontWeight: 'bold' }]}>일일 할 일</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <DraggableFlatList
        data={todos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onDragEnd={({ data }) => {
          setTodos(data);
          TodoService.updateTodoOrder(data.map(d => d.id));
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {tab === 'habit' ? '아직 습관이 없습니다.' : '할 일이 없습니다.'}
            </Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Plus color={colors.surface} size={24} />
      </TouchableOpacity>

      <AddTodoModal
        visible={modalVisible}
        type={tab}
        initialValues={editingTodo}
        onClose={() => {
          setModalVisible(false);
          setEditingTodo(undefined);
        }}
        onSave={handleSaveTodo}
      />

      {selectedHistoryTodo && (
        <HabitHistoryModal
          visible={historyModalVisible}
          todo={selectedHistoryTodo}
          onClose={() => {
            setHistoryModalVisible(false);
            setSelectedHistoryTodo(null);
          }}
        />
      )}

      {selectedDetailTodo && (
        <TodoDetailModal
          visible={detailVisible}
          todo={selectedDetailTodo}
          onClose={() => {
            setDetailVisible(false);
            setSelectedDetailTodo(null);
          }}
          onEdit={(id, content, description) => {
            setEditingTodo({ id, content, description });
            setModalVisible(true);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlRegion: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  dateLabelContainer: {
    paddingHorizontal: SPACING.sm,
    minWidth: 140,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  navBtn: {
    padding: SPACING.xs,
  },
  todayBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.sm,
    width: 44,
    alignItems: 'center',
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  compactProgress: {
    width: 44,
    alignItems: 'flex-end',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabWrapper: {
    paddingHorizontal: SPACING.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.md,
    padding: 2,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md - 2,
  },
  activeSegment: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  todoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  todoText: {
    marginLeft: SPACING.md,
    fontSize: 16,
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: SPACING.sm,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  emptyContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
