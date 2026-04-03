import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback, Alert, Dimensions } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import { Schedule } from '../types';
import { X, Calendar, Clock, AlignLeft, Trash2, Edit2, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface ScheduleDetailModalProps {
  visible: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onDelete: (schedule: Schedule) => void;
  onEdit: (schedule: Schedule) => void;
  onToggleCompletion?: (schedule: Schedule) => void;
}

export const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({
  visible,
  onClose,
  schedule,
  onDelete,
  onEdit,
  onToggleCompletion,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
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

  const getContrastColor = (hexcolor: string) => {
    let color = hexcolor.replace('#', '');
    if (color.length === 3) {
      color = color.split('').map(char => char + char).join('');
    }
    
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  };

  const contrastColor = schedule.is_completed ? getContrastColor(schedule.color) : colors.text;

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
              { 
                backgroundColor: colors.surface,
                maxHeight: Dimensions.get('window').height - insets.top - insets.bottom - SPACING.xl * 2 
              }
            ]}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.titleContainer}>
                  <View style={[styles.colorDot, { backgroundColor: schedule.color }]} />
                  <Text style={[styles.title, { color: colors.text }, schedule.is_completed && styles.completedText]} numberOfLines={2}>
                    {schedule.title}
                  </Text>
                </View>
                 <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                   <X color={colors.textSecondary} size={24} />
                 </TouchableOpacity>
               </View>

              <ScrollView style={styles.content}>
                <View style={styles.infoRow}>
                  <Calendar size={20} color={colors.primary} style={styles.icon} />
                  <Text style={[styles.value, { color: colors.text }]}>
                    {schedule.is_routine ? '루틴 일정' : '일반 일정'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Clock size={20} color={colors.primary} style={styles.icon} />
                  <Text style={[styles.value, { color: colors.text }]}>
                    {schedule.start_time} - {schedule.end_time}
                  </Text>
                </View>

                <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
                  <AlignLeft size={20} color={colors.primary} style={styles.icon} />
                  <Text style={[
                    styles.value, 
                    { flex: 1, fontWeight: 'normal', color: colors.text },
                    !schedule.description && { color: colors.textSecondary, fontStyle: 'italic' }
                  ]}>
                    {schedule.description || '(내용 없음)'}
                  </Text>
                </View>

                <View style={styles.completionSectionInside}>
                  <TouchableOpacity 
                    style={[
                      styles.checkboxContainer, 
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      schedule.is_completed && { backgroundColor: schedule.color, borderColor: schedule.color }
                    ]}
                    onPress={() => onToggleCompletion?.(schedule)}
                  >
                    <View style={[
                      styles.checkbox, 
                      { borderColor: colors.border },
                      schedule.is_completed && { borderColor: contrastColor }
                    ]}>
                      {schedule.is_completed && <Check size={16} color={contrastColor} strokeWidth={3} />}
                    </View>
                    <Text style={[
                      styles.completionText, 
                      { color: colors.text },
                      schedule.is_completed && { color: contrastColor, fontWeight: 'bold' }
                    ]}>
                      {schedule.is_completed ? '수행 완료' : '미완료 (수행하려면 체크)'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                {schedule.is_routine ? (
                  <View style={[styles.routineNotice, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.routineNoticeText, { color: colors.textSecondary }]}>
                      루틴 일정은 특정 날짜만 변경이 불가합니다.
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.editButton, { backgroundColor: colors.primary }]}
                    onPress={() => onEdit(schedule)}
                  >
                    <Edit2 size={16} color="white" style={{ marginRight: 6 }} />
                    <Text style={styles.editButtonText}>일정 변경</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.deleteButton, { backgroundColor: isDark ? colors.background : colors.error + '10', borderColor: colors.error }]} 
                  onPress={handleDeletePress}
                >
                  <Trash2 size={18} color={colors.error} />
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
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  closeButton: {
    padding: 2,
  },
  completionSectionInside: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  completionText: {
    fontSize: 15,
  },
  content: {
    padding: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  icon: {
    marginRight: 16,
  },
  value: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
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
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  routineNotice: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  routineNoticeText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
