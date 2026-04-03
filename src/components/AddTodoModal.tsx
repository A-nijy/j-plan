import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Dimensions, Keyboard } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface AddTodoModalProps {
  visible: boolean;
  type: 'habit' | 'daily';
  initialValues?: { id: string; content: string; description?: string };
  onClose: () => void;
  onSave: (todo: {
    id?: string;
    content: string;
    description?: string;
    type: 'habit' | 'daily';
  }) => void;
}

export default function AddTodoModal({ visible, type, initialValues, onClose, onSave }: AddTodoModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setContent(initialValues?.content || '');
      setDescription(initialValues?.description || '');
    }
  }, [visible, initialValues]);

  const handleSave = () => {
    if (!content.trim()) return;
    onSave({
      id: initialValues?.id,
      content,
      description,
      type,
    });
    setContent('');
    setDescription('');
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
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        
        <View style={[
          styles.modalContent, 
          { 
            backgroundColor: colors.surface,
            maxHeight: Dimensions.get('window').height - insets.top - SPACING.xl,
            marginTop: insets.top + SPACING.lg,
            paddingBottom: keyboardHeight > 0 
                ? keyboardHeight - (Platform.OS === 'android' ? 0 : insets.bottom) 
                : insets.bottom + SPACING.lg,
          }
        ]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{getTitle()}</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>제목</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="제목을 입력하세요"
                placeholderTextColor={colors.textSecondary + '80'}
                value={content}
                onChangeText={setContent}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>세부 내용</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="세부 내용을 입력하세요 (선택 사항)"
                placeholderTextColor={colors.textSecondary + '80'}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Text style={[styles.saveButtonText, { color: '#FFF' }]}>{getButtonText()}</Text>
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
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  input: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: SPACING.md,
  },
  saveButton: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
