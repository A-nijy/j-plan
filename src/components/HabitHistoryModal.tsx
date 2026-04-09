import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, ActivityIndicator, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Edit3 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isAfter, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TodoService } from '../services/TodoService';
import { useTheme } from '../context/ThemeContext';

interface HabitHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  todo: {
    id: string;
    content: string;
    description?: string;
  };
}

export default function HabitHistoryModal({ visible, onClose, todo }: HabitHistoryModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [historyData, setHistoryData] = useState<{ 
    completions: string[], 
    contentHistory: { content: string, description: string, start_date: string }[] 
  } | null>(null);
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
    if (!historyData) return { content: todo.content, description: todo.description || '' };
    const history = [...historyData.contentHistory]
      .sort((a, b) => b.start_date.localeCompare(a.start_date))
      .find(h => h.start_date <= date);
    
    return {
      content: history ? history.content : todo.content,
      description: history ? (history.description || '') : (todo.description || '')
    };
  };

  const isContentChangedDay = (date: string) => {
    if (!historyData) return false;
    return historyData.contentHistory.some(h => h.start_date === date);
  };

  const isCompletedDay = (date: string) => {
    if (!historyData) return false;
    return historyData.completions.includes(date);
  };

  const getStartDate = () => {
    if (!historyData || historyData.contentHistory.length === 0) return null;
    return historyData.contentHistory[0].start_date;
  };

  const renderCalendar = () => {
    const startDay = getDay(startOfMonth(currentMonth));
    const blanks = Array(startDay).fill(null);
    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: colors.text }]}>{format(currentMonth, 'yyyy년 M월')}</Text>
          <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekLabels}>
          {dayLabels.map((label, i) => (
            <Text key={i} style={[styles.dayLabel, { color: colors.textSecondary }, i === 0 && { color: '#FF8A8A' }, i === 6 && { color: '#8AB4FF' }]}>
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
                  isSelected && { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40', borderWidth: 1 }
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[
                  styles.dayText, 
                  { color: colors.text },
                  isSelected && { color: colors.primary, fontWeight: 'bold' },
                  isToday && [styles.todayText, { color: colors.primary }],
                  isFuture && { opacity: 0.3 }
                ]}>
                  {format(day, 'd')}
                </Text>
                <View style={styles.indicatorRow}>
                  {isCompleted && <View style={[styles.completionDot, { backgroundColor: colors.primary }]} />}
                  {isChanged && <Edit3 size={8} color={colors.primary} style={styles.editIcon} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const startDate = getStartDate();
  const isBeforeStart = startDate && selectedDateStr < startDate;
  const activeContent = getDayContent(selectedDateStr);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={[
          styles.modalContent, 
          { 
            backgroundColor: colors.surface,
            maxHeight: Dimensions.get('window').height - insets.top - insets.bottom - SPACING.xl * 2 
          }
        ]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.titleContainer}>
              <CalendarIcon size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{todo.content}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderCalendar()}

              <View style={[styles.legend, { marginTop: -SPACING.md, marginBottom: SPACING.lg }]}>
                <View style={styles.legendItem}>
                  <View style={[styles.completionDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>달성 완료</Text>
                </View>
                <View style={[styles.legendItem, { marginLeft: 16 }]}>
                  <Edit3 size={12} color={colors.primary} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>내용 수정일</Text>
                </View>
              </View>

              <View style={[styles.detailCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={[styles.detailHeader, { borderBottomColor: colors.border + '50' }]}>
                  <Text style={[styles.detailDate, { color: colors.text }]}>
                    {format(selectedDate, 'M월 d일 (E)', { locale: ko })}
                  </Text>
                  {isBeforeStart ? (
                    <View style={[styles.statusBadge, { backgroundColor: colors.border + '50' }]}>
                      <Text style={[styles.statusText, { color: colors.textSecondary }]}>시작 전</Text>
                    </View>
                  ) : isCompletedDay(selectedDateStr) ? (
                    <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.statusText, { color: colors.primary }]}>달성</Text>
                    </View>
                  ) : (
                    <Text style={[styles.uncompletedText, { color: colors.textSecondary }]}>미달성</Text>
                  )}
                </View>
                
                {isBeforeStart ? (
                  <View style={styles.contentWrap}>
                    <Text style={[styles.activeContentText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                      해당 습관이 시작되기 전입니다.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.contentWrap}>
                      <Text style={[styles.contentLabel, { color: colors.textSecondary }]}>제목</Text>
                      <Text style={[styles.activeContentText, { color: colors.text, fontWeight: '700', marginBottom: SPACING.sm }]}>
                        {activeContent.content}
                      </Text>
                      
                      <Text style={[styles.contentLabel, { color: colors.textSecondary }]}>세부 내용</Text>
                      <Text style={[
                        styles.activeContentText,
                        { color: colors.text },
                        !activeContent.description && { color: colors.textSecondary, fontStyle: 'italic' }
                      ]}>
                        {activeContent.description || '(내용 없음)'}
                      </Text>
                    </View>
                  </>
                )}
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '100%',
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
  dayText: {
    fontSize: 15,
  },
  todayText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
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
    marginHorizontal: 1,
  },
  editIcon: {
    marginHorizontal: 1,
  },
  detailCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
  },
  detailDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  uncompletedText: {
    fontSize: 13,
  },
  contentWrap: {
    marginTop: SPACING.xs,
  },
  contentLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  activeContentText: {
    fontSize: 15,
    lineHeight: 20,
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
  },
});
