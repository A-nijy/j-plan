import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { RoutineTemplate } from '../types';
import { X, Clock, AlignLeft, BarChart2 } from 'lucide-react-native';

interface RoutineDetailModalProps {
  visible: boolean;
  onClose: () => void;
  routine: (RoutineTemplate & { days: number[] }) | null;
  onEdit: (routine: RoutineTemplate & { days: number[] }) => void;
  onDelete: (id: string, title: string) => void;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export const RoutineDetailModal: React.FC<RoutineDetailModalProps> = ({
  visible,
  onClose,
  routine,
  onEdit,
  onDelete,
}) => {
  if (!routine) return null;

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
                  <View style={[styles.colorBar, { backgroundColor: routine.color }]} />
                  <Text style={styles.title} numberOfLines={2}>{routine.title}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X color={COLORS.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content}>
                <View style={styles.infoRow}>
                  <Clock size={20} color={COLORS.primary} style={styles.icon} />
                  <View>
                    <Text style={styles.label}>시간 정보</Text>
                    <Text style={styles.value}>
                      {routine.start_time} - {routine.end_time}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <BarChart2 size={20} color={COLORS.primary} style={styles.icon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>적용 요일</Text>
                    <View style={styles.daysContainer}>
                      {DAY_LABELS.map((label, idx) => {
                        const isActive = routine.days.includes(idx);
                        return (
                          <View 
                            key={idx} 
                            style={[
                              styles.dayBadge, 
                              isActive && { backgroundColor: routine.color + '20', borderColor: routine.color }
                            ]}
                          >
                            <Text style={[styles.dayBadgeText, isActive && { color: COLORS.text, fontWeight: 'bold' }]}>
                              {label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
                  <AlignLeft size={20} color={COLORS.primary} style={styles.icon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>설명</Text>
                    <Text style={[
                      styles.value, 
                      { fontWeight: 'normal' },
                      !routine.description && { color: COLORS.textSecondary, fontStyle: 'italic' }
                    ]}>
                      {routine.description || '(내용 없음)'}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => onEdit(routine)}
                >
                  <Text style={styles.editButtonText}>루틴 변경</Text>
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
    borderRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
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
  colorBar: {
    width: 6,
    height: 24,
    borderRadius: 3,
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
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '600',
    lineHeight: 24,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: COLORS.background,
  },
  dayBadgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
