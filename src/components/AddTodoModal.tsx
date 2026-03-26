import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AddTodoModalProps {
  visible: boolean;
  type: 'habit' | 'daily';
  initialValues?: { id: string; content: string };
  onClose: () => void;
  onSave: (todo: {
    id?: string;
    content: string;
    type: 'habit' | 'daily';
  }) => void;
}

export default function AddTodoModal({ visible, type, initialValues, onClose, onSave }: AddTodoModalProps) {
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (visible) {
      setContent(initialValues?.content || '');
    }
  }, [visible, initialValues]);

  const handleSave = () => {
    if (!content.trim()) return;
    onSave({
      id: initialValues?.id,
      content,
      type,
    });
    setContent('');
    onClose();
  };

  const getTitle = () => {
    if (initialValues) {
      return type === 'habit' ? '습관 수정' : '할 일 수정';
    }
    return type === 'habit' ? '습관 추가' : '할 일 추가';
  };

  const getButtonText = () => {
    return initialValues ? '수정하기' : '추가하기';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + SPACING.lg }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{getTitle()}</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>내용</Text>
            <TextInput
              style={styles.input}
              placeholder="내용을 입력하세요"
              value={content}
              onChangeText={setContent}
              autoFocus
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{getButtonText()}</Text>
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  form: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
