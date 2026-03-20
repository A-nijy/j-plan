import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, FlatList, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { TodoService } from '../../src/services/TodoService';
import { Todo } from '../../src/types';
import { CheckCircle2, Circle, Plus } from 'lucide-react-native';
import { format } from 'date-fns';
import AddTodoModal from '../../src/components/AddTodoModal';

export default function TodoScreen() {
  const [tab, setTab] = useState<'habit' | 'daily'>('habit');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadTodos();
  }, [tab]);

  const loadTodos = async () => {
    try {
      const data = await TodoService.getTodos(tab, today);
      setTodos(data);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  };

  const handleAddTodo = async (newTodo: any) => {
    try {
      await TodoService.createTodo({
        ...newTodo,
        is_completed: 0,
        target_date: tab === 'daily' ? today : null,
        habit_days: tab === 'habit' ? '1,2,3,4,5,6,0' : null,
      });
      loadTodos();
    } catch (error) {
      Alert.alert('오류', '할 일을 저장하지 못했습니다.');
    }
  };

  const handleToggle = async (id: string, currentStatus: number) => {
    try {
      await TodoService.toggleTodo(id, currentStatus === 0);
      loadTodos();
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDeleteTodo = (id: string) => {
    Alert.alert('할 일 삭제', '정말로 이 항목을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { 
        text: '삭제', 
        style: 'destructive',
        onPress: async () => {
          await TodoService.deleteTodo(id);
          loadTodos();
        }
      },
    ]);
  };

  const renderItem = ({ item }: { item: Todo }) => (
    <TouchableOpacity 
      style={styles.todoItem} 
      onPress={() => handleToggle(item.id, item.is_completed)}
      onLongPress={() => handleDeleteTodo(item.id)}
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

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, tab === 'habit' && styles.activeTabButton]} 
          onPress={() => setTab('habit')}
        >
          <Text style={[styles.tabText, tab === 'habit' && styles.activeTabText]}>매일 습관</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, tab === 'daily' && styles.activeTabButton]} 
          onPress={() => setTab('daily')}
        >
          <Text style={[styles.tabText, tab === 'daily' && styles.activeTabText]}>일일 할 일</Text>
        </TouchableOpacity>
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
        onClose={() => setModalVisible(false)}
        onSave={handleAddTodo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  activeTabText: {
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
