import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import { PRESET_COLORS } from '../constants/colors';
import { Clock, Check, Calendar } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

import { BaseModal } from './common/BaseModal';
import { FormInput } from './common/FormInput';
import { DatePickerModal } from './common/DatePickerModal';
import { TimePickerModal } from './common/TimePickerModal';

import { ScheduleService } from '../services/ScheduleService';
import { useTheme } from '../context/ThemeContext';

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

export default function AddScheduleModal({ 
  visible, onClose, onSave, initialDate, showDatePicker = true, initialValues 
}: AddScheduleModalProps) {
  const { colors } = useTheme();
  
  // States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startHour, setStartHour] = useState('09');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMin, setEndMin] = useState('00');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState<'start' | 'end' | 'date' | null>(null);

  useEffect(() => {
    if (visible) {
      setTitle(initialValues?.title || '');
      setDescription(initialValues?.description || '');
      
      const [sh, sm] = (initialValues?.start_time || '09:00').split(':');
      setStartHour(sh); setStartMin(sm);

      const [eh, em] = (initialValues?.end_time || '10:00').split(':');
      setEndHour(eh); setEndMin(em);

      setSelectedColor(initialValues?.color || PRESET_COLORS[0]);
      
      const targetDate = initialValues?.target_date || initialDate;
      setSelectedDate(targetDate ? parseISO(targetDate) : new Date());
    }
  }, [visible, initialDate, initialValues]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('알림', '일정을 입력해주세요.');
      return;
    }

    const startTime = `${startHour}:${startMin}`;
    const endTime = `${endHour}:${endMin}`;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const overlap = await ScheduleService.checkOverlap(dateStr, startTime, endTime, initialValues?.id);
    if (overlap.hasOverlap && overlap.conflictingItem) {
      Alert.alert('일정 중복', `해당 시간에 이미 다른 일정이 있습니다.\n\n[중복 일정]\n${overlap.conflictingItem.title}\n(${overlap.conflictingItem.start_time} - ${overlap.conflictingItem.end_time})`);
      return;
    }

    onSave({ title, description, start_time: startTime, end_time: endTime, color: selectedColor, target_date: dateStr });
  };

  const footer = (
    <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
      <Text style={[styles.saveButtonText, { color: '#FFF' }]}>
        {initialValues?.id ? '변경 완료' : '일정 저장'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <BaseModal
        visible={visible}
        onClose={onClose}
        title={initialValues?.id ? '일정 수정' : '새 일정 추가'}
        footer={footer}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <FormInput
            label="일정"
            placeholder="일정을 입력하세요"
            value={title}
            onChangeText={setTitle}
          />

          {showDatePicker && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>날짜</Text>
              <TouchableOpacity 
                style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowPicker('date')}
              >
                <Calendar size={18} color={colors.textSecondary} />
                <Text style={[styles.selectorText, { color: colors.text }]}>
                  {format(selectedDate, 'yyyy년 M월 d일 (E)', { locale: ko })}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>시작 시간</Text>
              <TouchableOpacity 
                style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowPicker('start')}
              >
                <Clock size={16} color={colors.textSecondary} />
                <Text style={[styles.selectorText, { color: colors.text }]}>{startHour}:{startMin}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ width: SPACING.md }} />
            <View style={styles.flex1}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>종료 시간</Text>
              <TouchableOpacity 
                style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowPicker('end')}
              >
                <Clock size={16} color={colors.textSecondary} />
                <Text style={[styles.selectorText, { color: colors.text }]}>{endHour}:{endMin}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>색상</Text>
            <View style={styles.colorContainer}>
              {PRESET_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    selectedColor.toLowerCase() === color.toLowerCase() && [styles.selectedColorCircle, { borderColor: colors.text }]
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor.toLowerCase() === color.toLowerCase() && <Check size={16} color="#000" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <FormInput
            label="설명 (선택)"
            placeholder="일정에 대한 추가 메모를 입력하세요"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </ScrollView>
      </BaseModal>

      <DatePickerModal
        visible={showPicker === 'date'}
        onClose={() => setShowPicker(null)}
        onSelect={(date) => { setSelectedDate(date); setShowPicker(null); }}
        initialDate={selectedDate}
      />

      <TimePickerModal
        visible={showPicker === 'start' || showPicker === 'end'}
        onClose={() => setShowPicker(null)}
        onConfirm={(h, m) => {
          if (showPicker === 'start') { setStartHour(h); setStartMin(m); }
          else { setEndHour(h); setEndMin(m); }
          setShowPicker(null);
        }}
        initialHour24={showPicker === 'start' ? startHour : endHour}
        initialMinute={showPicker === 'start' ? startMin : endMin}
        title={showPicker === 'start' ? '시작 시간 설정' : '종료 시간 설정'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  selectorText: {
    marginLeft: SPACING.sm,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  flex1: {
    flex: 1,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
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
