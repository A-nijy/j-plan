import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Edit3 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isAfter, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TodoService } from '../services/TodoService';

interface HabitHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  todo: {
    id: string;
    content: string;
  };
}

export default function HabitHistoryModal({ visible, onClose, todo }: HabitHistoryModalProps) {
  const insets = useSafeAreaInsets();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [historyData, setHistoryData] = useState<{ completions: string[], contentHistory: { content: string, start_date: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && todo.id) {
      loadHistory();
    }
  }, [visible, todo.id]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await TodoService.getHabitHistory(todo.id);
      setHistoryData(data);
    } catch (error) {
      console.error('Failed to load habit history:', error);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getDayContent = (date: string) => {
    if (!historyData) return todo.content;
    const history = [...historyData.contentHistory]
      .sort((a, b) => b.start_date.localeCompare(a.start_date))
      .find(h => h.start_date <= date);
    return history?.content || todo.content;
  };

  const isContentChangedDay = (date: string) => {
    if (!historyData) return false;
    return historyData.contentHistory.some(h => h.start_date === date);
  };

  const isCompletedDay = (date: string) => {
    if (!historyData) return false;
    return historyData.completions.includes(date);
  };

  const renderCalendar = () => {
    const startDay = getDay(startOfMonth(currentMonth));
    const blanks = Array(startDay).fill(null);
    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.monthText}>{format(currentMonth, 'yyyy년 M월')}</Text>
          <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekLabels}>
          {dayLabels.map((label, i) => (
            <Text key={i} style={[styles.dayLabel, i === 0 && { color: '#FFADAD' }, i === 6 && { color: '#A0C4FF' }]}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {blanks.map((_, i) => <View key={`blank-${i}`} style={styles.dayCell} />)}
          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCompleted = isCompletedDay(dateStr);
            const isChanged = isContentChangedDay(dateStr);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const isFuture = isAfter(startOfDay(day), startOfDay(new Date()));

            return (
              <TouchableOpacity 
                key={dateStr} 
                style={[
                  styles.dayCell, 
                  isSelected && styles.selectedDayCell
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[
                  styles.dayText, 
                  isSelected && styles.selectedDayText,
                  isToday && styles.todayText,
                  isFuture && { opacity: 0.3 }
                ]}>
                  {format(day, 'd')}
                </Text>
                <View style={styles.indicatorRow}>
                  {isCompleted && <View style={styles.completionDot} />}
                  {isChanged && <Edit3 size={8} color={COLORS.primary} style={styles.editIcon} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const activeContent = getDayContent(selectedDateStr);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + SPACING.lg }]}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <CalendarIcon size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle} numberOfLines={1}>{todo.content}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderCalendar()}

              <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailDate}>
                    {format(selectedDate, 'M월 d일 (E)', { locale: ko })}
                  </Text>
                  {isCompletedDay(selectedDateStr) ? (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>달성</Text>
                    </View>
                  ) : (
                    <Text style={styles.uncompletedText}>미달성</Text>
                  )}
                </View>
                
                <View style={styles.contentWrap}>
                  <Text style={styles.contentLabel}>당시 기록 내용</Text>
                  <Text style={styles.activeContentText}>{activeContent}</Text>
                </View>

                {isContentChangedDay(selectedDateStr) && (
                  <View style={styles.changeNotice}>
                    <Edit3 size={14} color={COLORS.primary} />
                    <Text style={styles.changeNoticeText}>이 날짜에 투두 내용이 수정되었습니다.</Text>
                  </View>
                )}
              </View>

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={styles.completionDot} />
                  <Text style={styles.legendText}>달성 완료</Text>
                </View>
                <View style={[styles.legendItem, { marginLeft: 16 }]}>
                  <Edit3 size={12} color={COLORS.primary} />
                  <Text style={styles.legendText}>내용 수정일</Text>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '90%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    marginBottom: SPACING.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  monthText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  weekLabels: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 4,
  },
  selectedDayCell: {
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  dayText: {
    fontSize: 15,
    color: COLORS.text,
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  selectedDayText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 10,
    marginTop: 2,
  },
  completionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginHorizontal: 1,
  },
  editIcon: {
    marginHorizontal: 1,
  },
  detailCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '50',
  },
  detailDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  uncompletedText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  contentWrap: {
    marginTop: SPACING.xs,
  },
  contentLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  activeContentText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
  },
  changeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: 8,
    backgroundColor: COLORS.primary + '08',
    borderRadius: 6,
  },
  changeNoticeText: {
    marginLeft: 6,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
