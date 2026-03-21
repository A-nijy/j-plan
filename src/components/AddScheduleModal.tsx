import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity, ScrollView, Platform, FlatList, Dimensions } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { X, Clock, Check, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  format, parseISO, getYear, getMonth, getDate, lastDayOfMonth,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, addMonths, isSameDay
} from 'date-fns';
import { ko } from 'date-fns/locale';
import WheelPicker from 'react-native-wheely';

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

const AMPMS = ['오전', '오후'];
const HOURS_12 = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const MINUTES_60 = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (hour24: string, minute: string) => void;
  initialHour24: string;
  initialMinute: string;
  title: string;
}

const TimePickerModal = ({ visible, onClose, onConfirm, initialHour24, initialMinute, title }: TimePickerModalProps) => {
  const [ampm, setAmpm] = useState('오전');
  const [h12, setH12] = useState('12');
  const [minute, setMinute] = useState('00');
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (visible) {
      const h24 = parseInt(initialHour24);
      setAmpm(h24 >= 12 ? '오후' : '오전');
      setH12((h24 % 12 || 12).toString());
      
      const m = parseInt(initialMinute);
      const snappedM = (Math.round(m / 5) * 5 % 60).toString().padStart(2, '0');
      setMinute(snappedM);
      setNonce(n => n + 1);
    }
  }, [visible, initialHour24, initialMinute]);

  const handleConfirm = () => {
    let finalH24 = parseInt(h12);
    if (ampm === '오후' && finalH24 < 12) finalH24 += 12;
    if (ampm === '오전' && finalH24 === 12) finalH24 = 0;
    onConfirm(finalH24.toString().padStart(2, '0'), minute);
  };

  const ampmIdx = Math.max(0, AMPMS.indexOf(ampm));
  const h12Idx = Math.max(0, HOURS_12.indexOf(h12));
  const minIdx = Math.max(0, MINUTES_60.indexOf(minute));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContent}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <View style={styles.pickerRow}>
            <View style={{ width: 80 }}>
              <WheelPicker
                key={`ampm-${nonce}`}
                selectedIndex={ampmIdx}
                options={AMPMS}
                onChange={(index) => setAmpm(AMPMS[index])}
                itemTextStyle={styles.wheelItemText}
                selectedIndicatorStyle={styles.wheelIndicator}
                itemHeight={44}
              />
            </View>
            <View style={{ width: 60 }}>
              <WheelPicker
                key={`hour-${nonce}`}
                selectedIndex={h12Idx}
                options={HOURS_12}
                onChange={(index) => setH12(HOURS_12[index])}
                itemTextStyle={styles.wheelItemText}
                selectedIndicatorStyle={styles.wheelIndicator}
                itemHeight={44}
              />
            </View>
            <Text style={styles.separator}>:</Text>
            <View style={{ width: 60 }}>
              <WheelPicker
                key={`min-${nonce}`}
                selectedIndex={minIdx}
                options={MINUTES_60}
                onChange={(index) => setMinute(MINUTES_60[index])}
                itemTextStyle={styles.wheelItemText}
                selectedIndicatorStyle={styles.wheelIndicator}
                itemHeight={44}
              />
            </View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButtonSmall} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
  initialDate: string;
  title: string;
}

const DatePickerModal = ({ visible, onClose, onConfirm, initialDate, title }: DatePickerModalProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (visible) {
      const d = parseISO(initialDate || format(new Date(), 'yyyy-MM-dd'));
      setCurrentMonth(startOfMonth(d));
      setSelectedDate(d);
    }
  }, [visible, initialDate]);

  const renderHeader = () => (
    <View style={styles.calendarNav}>
      <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentMonth(addMonths(currentMonth, -1))}>
        <ChevronLeft size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.calendarMonthText}>
        {format(currentMonth, 'yyyy년 M월', { locale: ko })}
      </Text>
      <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
        <ChevronRight size={24} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  );

  const renderDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

    return (
      <View style={styles.calendarGrid}>
        <View style={styles.weekdayRow}>
          {weekdays.map((day, i) => (
            <Text key={day} style={[styles.weekdayText, i === 0 && { color: '#FFADAD' }, i === 6 && { color: '#A0C4FF' }]}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {calendarDays.map((date, i) => {
            const isCurrentMonth = isSameMonth(date, monthStart);
            const isSelected = isSameDay(date, selectedDate);
            const isSun = date.getDay() === 0;
            const isSat = date.getDay() === 6;

            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dayCell,
                  isSelected && styles.selectedDayCell,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dayText,
                  !isCurrentMonth && styles.otherMonthText,
                  isSelected && styles.selectedDayText,
                  !isSelected && isSun && { color: '#FFADAD' },
                  !isSelected && isSat && { color: '#A0C4FF' },
                ]}>
                  {format(date, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.pickerOverlay}>
        <View style={styles.calendarContent}>
          <Text style={styles.pickerTitle}>{title}</Text>
          {renderHeader()}
          {renderDays()}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButtonSmall} 
              onPress={() => onConfirm(format(selectedDate, 'yyyy-MM-dd'))}
            >
              <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function AddScheduleModal({ 
  visible, 
  onClose, 
  onSave, 
  initialDate = format(new Date(), 'yyyy-MM-dd'),
  showDatePicker = false
}: AddScheduleModalProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startHour, setStartHour] = useState('09');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMin, setEndMin] = useState('00');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  
  const [showPicker, setShowPicker] = useState<'start' | 'end' | 'date' | null>(null);

  useEffect(() => {
    if (visible) {
      setSelectedDate(initialDate);
    }
  }, [visible, initialDate]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title,
      description,
      start_time: `${startHour}:${startMin}`,
      end_time: `${endHour}:${endMin}`,
      color: selectedColor,
      target_date: selectedDate,
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setTitle('');
    setDescription('');
    setStartHour('09');
    setStartMin('00');
    setEndHour('10');
    setEndMin('00');
    setSelectedColor(PRESET_COLORS[0]);
    onClose();
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

  const onConfirmDatePicker = (date: string) => {
    setSelectedDate(date);
    setShowPicker(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + SPACING.lg }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>일정 추가</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>제목</Text>
            <TextInput
              style={styles.input}
              placeholder="일정 제목을 입력하세요"
              value={title}
              onChangeText={setTitle}
            />

            {showDatePicker && (
              <>
                <Text style={styles.label}>날짜</Text>
                <TouchableOpacity 
                  style={styles.timeInput}
                  onPress={() => setShowPicker('date')}
                >
                  <Calendar size={16} color={COLORS.textSecondary} />
                  <Text style={styles.timeText}>
                    {format(parseISO(selectedDate), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.row}>
              <TouchableOpacity 
                style={styles.flex1} 
                onPress={() => setShowPicker('start')}
              >
                <Text style={styles.label}>시작 시간</Text>
                <View style={styles.timeInput}>
                  <Clock size={16} color={COLORS.textSecondary} />
                  <Text style={styles.timeText}>{startHour}:{startMin}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.flex1, { marginLeft: SPACING.md }]} 
                onPress={() => setShowPicker('end')}
              >
                <Text style={styles.label}>종료 시간</Text>
                <View style={styles.timeInput}>
                  <Clock size={16} color={COLORS.textSecondary} />
                  <Text style={styles.timeText}>{endHour}:{endMin}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>색상 선택</Text>
            <View style={styles.colorPicker}>
              {PRESET_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorOption,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <Text style={styles.label}>설명 (선택)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="상세 정보를 입력하세요"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>저장하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TimePickerModal 
        visible={showPicker === 'start' || showPicker === 'end'}
        onClose={() => setShowPicker(null)}
        onConfirm={onConfirmTimePicker}
        initialHour24={showPicker === 'start' ? startHour : endHour}
        initialMinute={showPicker === 'start' ? startMin : endMin}
        title={showPicker === 'start' ? '시작 시간 선택' : '종료 시간 선택'}
      />

      <DatePickerModal
        visible={showPicker === 'date'}
        onClose={() => setShowPicker(null)}
        onConfirm={onConfirmDatePicker}
        initialDate={selectedDate}
        title="날짜 선택"
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
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '85%',
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
    flex: 1,
  },
  form: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  timeText: {
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: COLORS.primary,
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
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '85%',
    alignItems: 'center',
  },
  calendarContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '90%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  calendarNav: {
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
  weekdayText: {
    flex: 1,
    textAlign: 'center',
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
    aspectRatio: 1,
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
  },
  selectedDayText: {
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  otherMonthText: {
    color: COLORS.border,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SPACING.md,
  },
  wheelItemText: {
    fontSize: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  wheelIndicator: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.md,
  },
  separator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginHorizontal: SPACING.xs,
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
