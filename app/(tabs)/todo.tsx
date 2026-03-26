import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, FlatList, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { TodoService } from '../../src/services/TodoService';
import { Todo } from '../../src/types';
import { CheckCircle2, Circle, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';
import { format, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import AddTodoModal from '../../src/components/AddTodoModal';

export default function TodoScreen() {
  const [tab, setTab] = useState<'habit' | 'daily'>('habit');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<{ id: string; content: string } | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    loadTodos();
  }, [tab, dateStr]);

  const loadTodos = async () => {
    try {
      const data = await TodoService.getTodos(tab, dateStr);
      setTodos(data);
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
        // Edit mode
        await TodoService.updateTodo(todoData.id, todoData.content);
      } else {
        // Add mode
        await TodoService.createTodo({
          ...todoData,
          is_completed: 0,
          target_date: tab === 'daily' ? dateStr : null,
          habit_days: tab === 'habit' ? '1,2,3,4,5,6,0' : null,
        });
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

  const handleLongPress = (item: Todo) => {
    Alert.alert(
      '할 일 관리',
      `"${item.content}"`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '수정', 
          onPress: () => {
            setEditingTodo({ id: item.id, content: item.content });
            setModalVisible(true);
          }
        },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: async () => {
            await TodoService.deleteTodo(item.id);
            loadTodos();
          }
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Todo }) => (
    <TouchableOpacity 
      style={styles.todoItem} 
      onPress={() => handleToggle(item.id, item.is_completed)}
      onLongPress={() => handleLongPress(item)}
    >
      {item.is_completed === 1 ? (
        <CheckCircle2 color={COLORS.primary} size={24} />
      ) : (
        <Circle color={COLORS.textSecondary} size={24} />
      )}
      <Text style={[styles.todoText, item.is_completed === 1 && styles.completedText]}>
        {item.content}
      </Text>
    </TouchableOpacity>
  );

  const completedCount = todos.filter(t => t.is_completed === 1).length;
  const totalCount = todos.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View style={styles.container}>
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
      
      <FlatList
        data={todos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
  todoText: {
    marginLeft: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
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
