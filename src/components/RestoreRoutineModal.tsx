import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { X, RotateCcw, Clock, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoutineService } from '../services/RoutineService';
import { ScheduleService } from '../services/ScheduleService';

interface RestoreRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
  onRestored: () => void;
}

export default function RestoreRoutineModal({ visible, onClose, date, onRestored }: RestoreRoutineModalProps) {
  const insets = useSafeAreaInsets();
  const [deletedRoutines, setDeletedRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      fetchDeletedRoutines();
    }
  }, [visible, date]);

  const fetchDeletedRoutines = async () => {
    try {
      setLoading(true);
      const routines = await RoutineService.getDeletedRoutinesForDate(date);
      setDeletedRoutines(routines);
    } catch (error) {
      console.error('Failed to fetch deleted routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (routine: any) => {
    try {
      // 1. Conflict Check
      const conflict = await ScheduleService.checkConflictForRestore(routine.id, date);
      
      if (conflict.hasOverlap && conflict.conflictingItem) {
        Alert.alert(
          '복구 불가',
          `해당 시간대에 겹치는 일정이 있어 복구할 수 없습니다.\n\n[충돌 일정]\n${conflict.conflictingItem.title}\n(${conflict.conflictingItem.start_time} - ${conflict.conflictingItem.end_time})`,
          [{ text: '확인' }]
        );
        return;
      }

      // 2. Restore
      await RoutineService.restoreRoutineForDate(routine.id, date);
      Alert.alert('성공', `"${routine.title}" 루틴이 복구되었습니다.`);
      
      onRestored();
      // Remove from local list
      setDeletedRoutines(prev => prev.filter(r => r.id !== routine.id));
      
      if (deletedRoutines.length <= 1) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to restore routine:', error);
      Alert.alert('오류', '루틴 복구 중 문제가 발생했습니다.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.routineCard}>
      <View style={[styles.colorBar, { backgroundColor: item.color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <Text style={styles.routineTitle}>{item.title}</Text>
          <View style={styles.timeRow}>
            <Clock size={14} color={COLORS.textSecondary} />
            <Text style={styles.timeText}>{item.start_time} - {item.end_time}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.restoreButton}
          onPress={() => handleRestore(item)}
        >
          <RotateCcw size={18} color={COLORS.primary} />
          <Text style={styles.restoreButtonText}>복구</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + SPACING.lg }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <RotateCcw size={20} color={COLORS.text} style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>삭제된 루틴 복구</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>{date}에 '오늘만 삭제'한 루틴 목록입니다.</Text>

          {loading ? (
            <ActivityIndicator style={{ padding: 40 }} color={COLORS.primary} />
          ) : deletedRoutines.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AlertCircle size={40} color={COLORS.textSecondary} opacity={0.3} />
              <Text style={styles.emptyText}>삭제된 루틴이 없습니다.</Text>
            </View>
          ) : (
            <FlatList
              data={deletedRoutines}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
            />
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  listContent: {
    paddingBottom: SPACING.md,
  },
  routineCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary + '15',
  },
  restoreButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  closeButton: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
});
