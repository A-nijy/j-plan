import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Schedule } from '../types';
import { X, Calendar, Clock, AlignLeft, Trash2 } from 'lucide-react-native';

interface ScheduleDetailModalProps {
  visible: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onDelete: (schedule: Schedule) => void;
}

export const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({
  visible,
  onClose,
  schedule,
  onDelete,
}) => {
  if (!schedule) return null;

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
                  <Calendar size={18} color={COLORS.primary} style={styles.icon} />
                  <View>
                    <Text style={styles.label}>유형</Text>
                    <Text style={styles.value}>
                      {schedule.is_routine ? '루틴 일정' : '일반 일정'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Clock size={18} color={COLORS.primary} style={styles.icon} />
                  <View>
                    <Text style={styles.label}>시간</Text>
                    <Text style={styles.value}>
                      {schedule.start_time} - {schedule.end_time}
                    </Text>
                  </View>
                </View>

                {schedule.description ? (
                  <View style={styles.infoRow}>
                    <AlignLeft size={18} color={COLORS.primary} style={styles.icon} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>설명</Text>
                      <Text style={styles.descriptionText}>{schedule.description}</Text>
                    </View>
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => onDelete(schedule)}
                >
                  <Trash2 size={18} color={COLORS.error} style={{ marginRight: 8 }} />
                  <Text style={styles.deleteButtonText}>
                    {schedule.is_routine ? '루틴 오늘만 삭제' : '일정 삭제'}
                  </Text>
                </TouchableOpacity>
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
    marginBottom: SPACING.lg,
  },
  icon: {
    marginTop: 2,
    marginRight: 12,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.error + '10', // Light error background
    width: '100%',
  },
  deleteButtonText: {
    color: COLORS.error,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
