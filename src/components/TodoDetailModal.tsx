import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import { X, CheckCircle2, Circle, Edit3, AlignLeft, Type } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface TodoDetailModalProps {
  visible: boolean;
  onClose: () => void;
  todo: {
    id: string;
    content: string;
    description?: string;
    is_completed: number;
    target_date?: string;
  } | null;
  onEdit: (id: string, content: string, description?: string) => void;
}

export const TodoDetailModal: React.FC<TodoDetailModalProps> = ({
  visible,
  onClose,
  todo,
  onEdit,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

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
            <View style={[
              styles.modalContainer, 
              { 
                backgroundColor: colors.surface,
                maxHeight: Dimensions.get('window').height - insets.top - insets.bottom - SPACING.xl * 2 
              }
            ]}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.titleContainer}>
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>할 일 상세</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content}>

                <View style={[styles.contentSection, { marginBottom: SPACING.xl }]}>
                  <View style={styles.infoRow}>
                    <Type size={20} color={colors.primary} style={styles.icon} />
                    <Text style={[styles.contentText, { color: colors.text, fontWeight: '700' }]}>{todo.content}</Text>
                  </View>
                </View>

                <View style={styles.contentSection}>
                  <View style={styles.infoRow}>
                    <AlignLeft size={20} color={colors.primary} style={styles.icon} />
                    <Text style={[
                      styles.contentText, 
                      { color: colors.text },
                      !todo.description && { color: colors.textSecondary, fontStyle: 'italic' }
                    ]}>
                      {todo.description || '(내용 없음)'}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <TouchableOpacity 
                  style={[styles.editButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    onEdit(todo.id, todo.content, todo.description);
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
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 2,
  },
  content: {
    padding: SPACING.lg,
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
    lineHeight: 24,
    flex: 1,
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  editButton: {
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
});
