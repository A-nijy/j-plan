import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Dimensions, Keyboard } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { X, Clock, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TimePickerModal } from './common/TimePickerModal';
import { ScheduleService } from '../services/ScheduleService';

interface AddRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (routine: {
    id?: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    color: string;
    days: number[]; // 0-6
  }) => void;
  initialData?: {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    color: string;
    days: number[];
  };
}

const PRESET_COLORS = [
  '#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF', '#95D5B2', '#9D8189', '#BEE1E6', '#E9ECEF'
];

const WEEKDAYS = [
  { label: '일', value: 0 },
  { label: '월', value: 1 },
  { label: '화', value: 2 },
  { label: '수', value: 3 },
  { label: '목', value: 4 },
  { label: '금', value: 5 },
  { label: '토', value: 6 },
];

export default function AddRoutineModal({ visible, onClose, onSave, initialData }: AddRoutineModalProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startHour, setStartHour] = useState('09');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMin, setEndMin] = useState('00');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedDays, setSelectedDays] = useState<number[]>(initialData?.days || []);
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
  
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description || '');
        const [sh, sm] = initialData.start_time.split(':');
        const [eh, em] = initialData.end_time.split(':');
        setStartHour(sh);
        setStartMin(sm);
        setEndHour(eh);
        setEndMin(em);
        setSelectedColor(initialData.color);
        setSelectedDays(initialData.days || []);
      } else {
        setTitle('');
        setDescription('');
        setStartHour('09');
        setStartMin('00');
        setEndHour('10');
        setEndMin('00');
        setSelectedColor(PRESET_COLORS[0]);
        setSelectedDays([]);
      }
    }
  }, [visible, initialData]);

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('알림', '루틴 이름을 입력해주세요.');
      return;
    }
    
    if (selectedDays.length === 0) {
      Alert.alert('알림', '최소 하나 이상의 요일을 선택해주세요.');
      return;
    }

    const startTime = `${startHour}:${startMin}`;
    const endTime = `${endHour}:${endMin}`;

    // Overlap check
    try {
      const overlap = await ScheduleService.checkRoutineOverlap(
        selectedDays, 
        startTime, 
        endTime, 
        initialData?.id
      );

      if (overlap.hasOverlap && overlap.conflictingItem) {
        Alert.alert(
          '루틴 중복',
          `해당 요일 및 시간대에 이미 다른 루틴이 있습니다.\n\n[중복 루틴]\n${overlap.conflictingItem.title}\n(${overlap.conflictingItem.start_time} - ${overlap.conflictingItem.end_time})`,
          [{ text: '확인' }]
        );
        return;
      }

      onSave({
        id: initialData?.id,
        title,
        description,
        start_time: startTime,
        end_time: endTime,
        color: selectedColor,
        days: selectedDays,
      });
      onClose();
    } catch (error) {
      console.error('Overlap check failed:', error);
      Alert.alert('오류', '중복 검사 중 문제가 발생했습니다.');
    }
  };

  const onConfirmTimePicker = (h: string, m: string) => {
    if (showPicker === 'start') {
      setStartHour(h);
      setStartMin(m);
    } else if (showPicker === 'end') {
      setEndHour(h);
      setEndMin(m);
    }
    setShowPicker(null);
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
              maxHeight: Dimensions.get('window').height - insets.top - SPACING.xl,
              marginTop: insets.top + SPACING.lg,
              paddingBottom: keyboardHeight > 0 
                ? keyboardHeight - (Platform.OS === 'android' ? 0 : insets.bottom) 
                : insets.bottom + SPACING.lg,
            }
          ]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{initialData ? '루틴 수정' : '새 루틴 추가'}</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>루틴 이름</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 아침 운동, 독서 시간"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>반복 요일</Text>
            <View style={styles.daysContainer}>
              {WEEKDAYS.map((day) => {
                const isActive = selectedDays.includes(day.value);
                return (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.dayButton,
                      isActive && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                    ]}
                    onPress={() => toggleDay(day.value)}
                  >
                    <Text style={[styles.dayButtonText, isActive && { color: 'white' }]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>시작 시간</Text>
                <TouchableOpacity 
                  style={styles.timeInput}
                  onPress={() => setShowPicker('start')}
                >
                  <Clock size={16} color={COLORS.textSecondary} />
                  <Text style={styles.timeText}>{startHour}:{startMin}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: SPACING.md }} />
              <View style={styles.flex1}>
                <Text style={styles.label}>종료 시간</Text>
                <TouchableOpacity 
                  style={styles.timeInput}
                  onPress={() => setShowPicker('end')}
                >
                  <Clock size={16} color={COLORS.textSecondary} />
                  <Text style={styles.timeText}>{endHour}:{endMin}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>색상</Text>
            <View style={styles.colorContainer}>
              {PRESET_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorCircle
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && <Check size={16} color="#000" />}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>설명 (선택)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="루틴에 대한 추가 메모를 입력하세요"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>루틴 저장</Text>
          </TouchableOpacity>
        </View>
      </View>

    <TimePickerModal
      visible={showPicker !== null}
      onClose={() => setShowPicker(null)}
      onConfirm={onConfirmTimePicker}
      initialHour24={showPicker === 'start' ? startHour : endHour}
      initialMinute={showPicker === 'start' ? startMin : endMin}
      title={showPicker === 'start' ? '시작 시간 설정' : '종료 시간 설정'}
    />
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
  keyboardView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  flex1: {
    flex: 1,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeText: {
    marginLeft: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColorCircle: {
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
