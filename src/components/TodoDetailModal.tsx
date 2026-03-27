import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { X, CheckCircle2, Circle, Edit3, AlignLeft } from 'lucide-react-native';

interface TodoDetailModalProps {
  visible: boolean;
  onClose: () => void;
  todo: {
    id: string;
    content: string;
    is_completed: number;
    target_date?: string;
  } | null;
  onEdit: (id: string, content: string) => void;
  onToggle: (id: string, currentStatus: number) => void;
}

export const TodoDetailModal: React.FC<TodoDetailModalProps> = ({
  visible,
  onClose,
  todo,
  onEdit,
  onToggle,
}) => {
  if (!todo) return null;

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
                  <Text style={styles.title} numberOfLines={2}>할 일 상세</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X color={COLORS.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content}>
                <View style={styles.statusSection}>
                   <TouchableOpacity 
                    style={styles.statusToggle}
                    onPress={() => onToggle(todo.id, todo.is_completed)}
                  >
                    {todo.is_completed === 1 ? (
                      <CheckCircle2 color={COLORS.primary} size={32} />
                    ) : (
                      <Circle color={COLORS.textSecondary} size={32} />
                    )}
                    <View style={styles.statusInfo}>
                      <Text style={styles.statusLabel}>상태</Text>
                      <Text style={[styles.statusValue, todo.is_completed === 1 && { color: COLORS.primary }]}>
                        {todo.is_completed === 1 ? '완료됨' : '진행 중'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <View style={styles.contentSection}>
                  <View style={styles.infoRow}>
                    <AlignLeft size={20} color={COLORS.primary} style={styles.icon} />
                    <Text style={styles.contentText}>{todo.content}</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => {
                    onEdit(todo.id, todo.content);
                    onClose();
                  }}
                >
                  <Edit3 size={16} color="white" style={{ marginRight: 6 }} />
                  <Text style={styles.editButtonText}>할 일 변경</Text>
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
    maxHeight: '70%',
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
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 2,
  },
  content: {
    padding: SPACING.lg,
  },
  statusSection: {
    marginBottom: SPACING.lg,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  statusInfo: {
    marginLeft: SPACING.md,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  contentSection: {
    marginBottom: SPACING.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  contentText: {
    fontSize: 17,
    color: COLORS.text,
    lineHeight: 24,
    flex: 1,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
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
