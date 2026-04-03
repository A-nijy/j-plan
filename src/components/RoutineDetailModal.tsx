import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback, Alert, Dimensions } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import { RoutineTemplate } from '../types';
import { X, Clock, AlignLeft, BarChart2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

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
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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
            <View style={[
              styles.modalContainer, 
              { backgroundColor: colors.surface },
              { maxHeight: Dimensions.get('window').height - insets.top - insets.bottom - SPACING.xl * 2 }
            ]}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.titleContainer}>
                  <View style={[styles.colorBar, { backgroundColor: routine.color }]} />
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{routine.title}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content}>
                <View style={styles.infoRow}>
                  <Clock size={20} color={colors.primary} style={styles.icon} />
                  <View>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>시간 정보</Text>
                    <Text style={[styles.value, { color: colors.text }]}>
                      {routine.start_time} - {routine.end_time}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <BarChart2 size={20} color={colors.primary} style={styles.icon} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>적용 요일</Text>
                    <View style={styles.daysContainer}>
                      {DAY_LABELS.map((label, idx) => {
                        const isActive = routine.days.includes(idx);
                        return (
                          <View 
                            key={idx} 
                            style={[
                              styles.dayBadge, 
                              { backgroundColor: colors.background },
                              isActive && { backgroundColor: routine.color + '20', borderColor: routine.color }
                            ]}
                          >
                            <Text style={[styles.dayBadgeText, { color: colors.textSecondary }, isActive && { color: colors.text, fontWeight: 'bold' }]}>
                              {label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
                  <AlignLeft size={20} color={colors.primary} style={styles.icon} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>설명</Text>
                    <Text style={[
                      styles.value, 
                      { color: colors.text, fontWeight: 'normal' },
                      !routine.description && { color: colors.textSecondary, fontStyle: 'italic' }
                    ]}>
                      {routine.description || '(내용 없음)'}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <TouchableOpacity 
                  style={[styles.editButton, { backgroundColor: colors.primary }]}
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
    borderRadius: BORDER_RADIUS.xl,
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
    marginBottom: 4,
  },
  value: {
    fontSize: 17,
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
  },
  dayBadgeText: {
    fontSize: 12,
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  editButton: {
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
});
