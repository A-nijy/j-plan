import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { Schedule } from '../types';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import SwipeableRow from './common/SwipeableRow';

interface ScheduleItemProps {
  item: Schedule;
  colors: any;
  onPress: (item: Schedule) => void;
  onDelete: (item: Schedule) => void;
  onToggle: (item: Schedule) => void;
}

/**
 * Optimized Individual Schedule Item Component
 * Uses React.memo to prevent unnecessary re-renders when parent state changes.
 */
const ScheduleItem = React.memo(({ 
  item, 
  colors, 
  onPress, 
  onDelete, 
  onToggle 
}: ScheduleItemProps) => {
  return (
    <>
      <SwipeableRow
        onDelete={() => onDelete(item)}
        deleteText={item.is_routine ? "오늘만 삭제" : "삭제"}
        deleteConfirmMessage={
          item.is_routine 
            ? "이 루틴은 오늘 일정에서만 삭제됩니다. 삭제하시겠습니까?" 
            : "정말로 이 일정을 삭제하시겠습니까?"
        }
      >
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => onPress(item)}
          style={[styles.scheduleItem, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.colorBar, { backgroundColor: item.color }]} />
          <View style={styles.scheduleCardContent}>
            <View style={styles.scheduleInfo}>
              <View style={styles.titleRow}>
                <Text 
                  style={[
                    styles.scheduleTitle, 
                    { color: colors.text }, 
                    item.is_completed && styles.completedText
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {item.is_routine && (
                  <View style={[styles.routineBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.routineBadgeText, { color: colors.primary }]}>루틴</Text>
                  </View>
                )}
              </View>
              <Text 
                style={[
                  styles.scheduleTime, 
                  { color: colors.textSecondary }, 
                  item.is_completed && styles.completedText
                ]}
              >
                {item.start_time} - {item.end_time}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.checkbox, 
                { borderColor: colors.border, backgroundColor: colors.surface },
                item.is_completed && { backgroundColor: item.color, borderColor: item.color }
              ]}
              onPress={() => onToggle(item)}
            >
              {item.is_completed && <Check size={14} color="white" strokeWidth={3} />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </SwipeableRow>
      <View style={{ height: SPACING.sm }} />
    </>
  );
});

const styles = StyleSheet.create({
  scheduleItem: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  colorBar: {
    width: 6,
  },
  scheduleCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  scheduleInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  routineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  routineBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  scheduleTime: {
    fontSize: 13,
    marginTop: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    marginLeft: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
});

export default ScheduleItem;
