import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Schedule } from '../types';
import { X, Calendar, Clock, AlignLeft, Trash2, Edit2 } from 'lucide-react-native';

interface ScheduleDetailModalProps {
  visible: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onDelete: (schedule: Schedule) => void;
  onEdit: (schedule: Schedule) => void;
}

export const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({
  visible,
  onClose,
  schedule,
  onDelete,
  onEdit,
}) => {
  if (!schedule) return null;

  const handleDeletePress = () => {
    Alert.alert(
      schedule.is_routine ? '루틴 삭제' : '일정 삭제',
      schedule.is_routine ? '이 루틴을 오늘 일정에서 삭제할까요?' : '이 일정을 정말로 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive', 
          onPress: () => onDelete(schedule) 
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <View style={[styles.colorDot, { backgroundColor: schedule.color }]} />
                  <Text style={styles.title} numberOfLines={2}>{schedule.title}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X color={COLORS.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content}>
                <View style={styles.infoRow}>
                  <Calendar size={20} color={COLORS.primary} style={styles.icon} />
                  <Text style={styles.value}>
                    {schedule.is_routine ? '루틴 일정' : '일반 일정'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Clock size={20} color={COLORS.primary} style={styles.icon} />
                  <Text style={styles.value}>
                    {schedule.start_time} - {schedule.end_time}
                  </Text>
                </View>

                <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
                  <AlignLeft size={20} color={COLORS.primary} style={styles.icon} />
                  <Text style={[
                    styles.value, 
                    { flex: 1, fontWeight: 'normal' },
                    !schedule.description && { color: COLORS.textSecondary, fontStyle: 'italic' }
                  ]}>
                    {schedule.description || '(내용 없음)'}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.footer}>
                {schedule.is_routine ? (
                  <View style={styles.routineNotice}>
                    <Text style={styles.routineNoticeText}>
                      루틴 일정은 특정 날짜만 변경이 불가합니다.
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => onEdit(schedule)}
                  >
                    <Edit2 size={16} color="white" style={{ marginRight: 6 }} />
                    <Text style={styles.editButtonText}>일정 변경</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    maxHeight: '80%',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: SPACING.md,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 2,
  },
  content: {
    padding: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  icon: {
    marginRight: 16,
  },
  value: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '600',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  routineNotice: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  routineNoticeText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
});
