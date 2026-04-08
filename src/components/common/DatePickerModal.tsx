import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { 
  format, eachDayOfInterval, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths 
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  initialDate: Date;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({ 
  visible, onClose, onSelect, initialDate 
}) => {
  const { colors } = useTheme();
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
        <View style={[styles.calendarContent, { backgroundColor: colors.surface }]}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={[styles.navBtn, { backgroundColor: colors.background }]}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.calendarMonthText, { color: colors.text }]}>
              {format(currentMonth, 'yyyy년 M월', { locale: ko })}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={[styles.navBtn, { backgroundColor: colors.background }]}>
              <ChevronRight size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarGrid}>
            <View style={styles.weekdayRow}>
              {weekDayLabels.map(label => (
                <View key={label} style={styles.weekdayCell}>
                  <Text style={[styles.weekdayText, { color: colors.textSecondary }]}>{label}</Text>
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
                    style={[
                      styles.dayCell, 
                      isSelected && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setSelectedDate(day)}
                  >
                    <Text style={[
                      styles.dayText, 
                      { color: colors.text },
                      isSelected && { color: '#FFF', fontWeight: 'bold' },
                      !isCurrentMonth && { color: colors.border }
                    ]}>
                      {format(day, 'd')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButtonSmall, { backgroundColor: colors.primary }]} 
              onPress={() => {
                onSelect(selectedDate);
                onClose();
              }}
            >
              <Text style={[styles.confirmButtonText, { color: '#FFF' }]}>선택</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContent: {
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
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  dayText: {
    fontSize: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
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
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: 'bold',
  },
  confirmButtonSmall: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontWeight: 'bold',
  },
});
