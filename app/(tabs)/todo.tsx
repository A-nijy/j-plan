import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, FlatList, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
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

export default function TodoScreen() {
  const [tab, setTab] = useState<'habit' | 'daily'>('habit');
  const [todos, setTodos] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<{ id: string; content: string } | undefined>(undefined);
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
        // Edit mode - versioned by current selected date
        await TodoService.updateTodo(todoData.id, todoData.content, dateStr);
      } else {
        // Add mode
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
            isActive && { backgroundColor: COLORS.background, elevation: 5 },
            { marginBottom: 0 }
          ]} 
          onPress={() => handlePressItem(item)}
          onLongPress={drag}
          delayLongPress={200}
        >
          <View style={styles.todoLeft}>
            <TouchableOpacity onPress={() => handleToggle(item.id, item.is_completed)}>
              {item.is_completed === 1 ? (
                <CheckCircle2 color={COLORS.primary} size={24} />
              ) : (
                <Circle color={COLORS.textSecondary} size={24} />
              )}
            </TouchableOpacity>
            <Text style={[styles.todoText, item.is_completed === 1 && styles.completedText]}>
              {item.content}
            </Text>
          </View>

          {tab === 'habit' && (
            <TouchableOpacity 
              style={styles.streakBadge}
              onPress={() => {
                setSelectedHistoryTodo(item);
                setHistoryModalVisible(true);
              }}
            >
              <Flame size={14} color={item.streak > 0 ? '#FF8B3D' : COLORS.textSecondary} style={{ marginRight: 2 }} />
              <Text style={[styles.streakText, item.streak > 0 && { color: '#FF8B3D' }]}>{item.streak}</Text>
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
    <View style={styles.container}>
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
      {/* Integrated Compact Header */}
      <View style={styles.controlRegion}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.todayBtn} 
            onPress={() => setSelectedDate(new Date())}
          >
            <Text style={styles.todayBtnText}>오늘</Text>
          </TouchableOpacity>

          <View style={styles.dateNav}>
            <TouchableOpacity style={styles.navBtn} onPress={() => moveDate(-1)}>
              <ChevronLeft color={COLORS.text} size={22} />
            </TouchableOpacity>
            <View style={styles.dateLabelContainer}>
              <Text style={styles.dateText}>
                {format(selectedDate, 'M월 d일 (E)', { locale: ko })}
              </Text>
            </View>
            <TouchableOpacity style={styles.navBtn} onPress={() => moveDate(1)}>
              <ChevronRight color={COLORS.text} size={22} />
            </TouchableOpacity>
          </View>

          <View style={styles.compactProgress}>
            <Text style={styles.progressValue}>{progressPercentage}%</Text>
          </View>
        </View>

        <View style={styles.tabWrapper}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity 
              style={[styles.segmentBtn, tab === 'habit' && styles.activeSegment]} 
              onPress={() => setTab('habit')}
            >
              <Text style={[styles.segmentText, tab === 'habit' && styles.activeSegmentText]}>매일 습관</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segmentBtn, tab === 'daily' && styles.activeSegment]} 
              onPress={() => setTab('daily')}
            >
              <Text style={[styles.segmentText, tab === 'daily' && styles.activeSegmentText]}>일일 할 일</Text>
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
            <Text style={styles.emptyText}>
              {tab === 'habit' ? '아직 습관이 없습니다.' : '할 일이 없습니다.'}
            </Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Plus color={COLORS.surface} size={24} />
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
          onEdit={(id, content) => {
            setEditingTodo({ id, content });
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
    backgroundColor: COLORS.background,
  },
  controlRegion: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    color: COLORS.text,
  },
  navBtn: {
    padding: SPACING.xs,
  },
  todayBtn: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.sm,
    width: 44,
    alignItems: 'center',
  },
  todayBtnText: {
    color: COLORS.primary,
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
    color: COLORS.primary,
  },
  tabWrapper: {
    paddingHorizontal: SPACING.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  segmentText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeSegmentText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 120, // Increased for safe area
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  todoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  todoText: {
    marginLeft: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  streakText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
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
});
