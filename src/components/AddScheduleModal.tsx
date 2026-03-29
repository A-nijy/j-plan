import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity, ScrollView, Platform, FlatList, Dimensions, Alert, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { X, Clock, Check, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  format, parseISO, getYear, getMonth, getDate, lastDayOfMonth,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, addMonths, isSameDay
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { TimePickerModal } from './common/TimePickerModal';
import { ScheduleService } from '../services/ScheduleService';

interface AddScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (schedule: {
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    color: string;
    target_date: string;
  }) => void;
  initialDate?: string; // YYYY-MM-DD
  showDatePicker?: boolean;
  initialValues?: {
    id?: string;
    title?: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    color?: string;
    is_routine?: boolean;
    target_date?: string;
  };
}

const PRESET_COLORS = [
  '#FFADAD', // Red
  '#FFD6A5', // Orange
  '#FDFFB6', // Yellow
  '#CAFFBF', // Green
  '#9BF6FF', // Sky Blue
  '#A0C4FF', // Blue
  '#BDB2FF', // Purple
  '#FFC6FF', // Pink
  '#95D5B2', // Mint/Sage
  '#9D8189', // Muted Brown
  '#BEE1E6', // Steel Blue
  '#E9ECEF', // Neutral Gray
];

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  initialDate: Date;
}

const DatePickerModal = ({ visible, onClose, onSelect, initialDate }: DatePickerModalProps) => {
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 }),
  });

  useEffect(() => {
    setSelectedDate(initialDate);
    setCurrentMonth(initialDate);
  }, [initialDate, visible]);

  const handlePrevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.pickerOverlay}>
        <View style={styles.calendarContent}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
              <ChevronLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.calendarMonthText}>
              {format(currentMonth, 'yyyy년 M월', { locale: ko })}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <ChevronRight size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarGrid}>
            <View style={styles.weekdayRow}>
              {weekDayLabels.map(label => (
                <View key={label} style={styles.weekdayCell}>
                  <Text style={styles.weekdayText}>{label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {days.map((day, idx) => {
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dayCell, isSelected && styles.selectedDayCell]}
                    onPress={() => setSelectedDate(day)}
                  >
                    <Text style={[
                      styles.dayText, 
                      isSelected && styles.selectedDayText,
                      !isCurrentMonth && styles.otherMonthText
                    ]}>
                      {format(day, 'd')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButtonSmall} 
              onPress={() => {
                onSelect(selectedDate);
                onClose();
              }}
            >
              <Text style={styles.confirmButtonText}>선택</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function AddScheduleModal({ 
  visible, onClose, onSave, initialDate, showDatePicker = true, initialValues 
}: AddScheduleModalProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startHour, setStartHour] = useState('09');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMin, setEndMin] = useState('00');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [showPicker, setShowPicker] = useState<'start' | 'end' | 'date' | null>(null);
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
      setTitle(initialValues?.title || '');
      setDescription(initialValues?.description || '');
      
      if (initialValues?.start_time) {
        const [h, m] = initialValues.start_time.split(':');
        setStartHour(h);
        setStartMin(m);
      } else {
        setStartHour('09');
        setStartMin('00');
      }

      if (initialValues?.end_time) {
        const [h, m] = initialValues.end_time.split(':');
        setEndHour(h);
        setEndMin(m);
      } else {
        setEndHour('10');
        setEndMin('00');
      }

      setSelectedColor(initialValues?.color || PRESET_COLORS[0]);
      
      if (initialValues?.target_date) {
        setSelectedDate(parseISO(initialValues.target_date));
      } else if (initialDate) {
        setSelectedDate(parseISO(initialDate));
      } else {
        setSelectedDate(new Date());
      }
    }
  }, [visible, initialDate, initialValues]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('알림', '일정을 입력해주세요.');
      return;
    }

    // Overlap check
    const startTime = `${startHour}:${startMin}`;
    const endTime = `${endHour}:${endMin}`;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const overlap = await ScheduleService.checkOverlap(dateStr, startTime, endTime, initialValues?.id);
    if (overlap.hasOverlap && overlap.conflictingItem) {
      Alert.alert(
        '일정 중복',
        `해당 시간에 이미 다른 일정이 있습니다.\n\n[중복 일정]\n${overlap.conflictingItem.title}\n(${overlap.conflictingItem.start_time} - ${overlap.conflictingItem.end_time})`,
        [{ text: '확인' }]
      );
      return;
    }

    onSave({
      title,
      description,
      start_time: startTime,
      end_time: endTime,
      color: selectedColor,
      target_date: dateStr,
    });
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
            <Text style={styles.headerTitle}>
              {initialValues?.id ? '일정 수정' : '새 일정 추가'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>일정</Text>
            <TextInput
              style={styles.input}
              placeholder="일정을 입력하세요"
              value={title}
              onChangeText={setTitle}
            />

            {showDatePicker && (
              <>
                <Text style={styles.label}>날짜</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowPicker('date')}
                >
                  <Calendar size={18} color={COLORS.textSecondary} />
                  <Text style={styles.dateText}>
                    {format(selectedDate, 'yyyy년 M월 d일 (E)', { locale: ko })}
                  </Text>
                </TouchableOpacity>
              </>
            )}

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
                    selectedColor.toLowerCase() === color.toLowerCase() && styles.selectedColorCircle
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor.toLowerCase() === color.toLowerCase() && <Check size={16} color="#000" />}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>설명 (선택)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="일정에 대한 추가 메모를 입력하세요"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </ScrollView>
            
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {initialValues?.id ? '변경 완료' : '일정 저장'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

    <DatePickerModal
      visible={showPicker === 'date'}
      onClose={() => setShowPicker(null)}
      onSelect={setSelectedDate}
      initialDate={selectedDate}
    />

    <TimePickerModal
      visible={showPicker === 'start' || showPicker === 'end'}
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
    padding: SPACING.lg,
    width: '100%',
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
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  dateText: {
    marginLeft: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
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
    padding: SPACING.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '90%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  navBtn: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  calendarGrid: {
    marginBottom: SPACING.md,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  weekdayCell: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdayText: {
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  selectedDayCell: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  selectedDayText: {
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  otherMonthText: {
    color: COLORS.border,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  confirmButtonSmall: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.surface,
    fontWeight: 'bold',
  },
});
