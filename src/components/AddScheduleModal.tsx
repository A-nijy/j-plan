import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity, ScrollView, Platform, FlatList } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { X, Clock, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';

interface AddScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (schedule: {
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    color: string;
  }) => void;
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

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

import WheelPicker from 'react-native-wheely';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (hour24: string, minute: string) => void;
  initialHour24: string;
  initialMinute: string;
  title: string;
}

const AMPMS = ['오전', '오후'];
const HOURS_12 = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const MINUTES_60 = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

const TimePickerModal = ({ visible, onClose, onConfirm, initialHour24, initialMinute, title }: TimePickerModalProps) => {
  const [ampm, setAmpm] = useState('오전');
  const [h12, setH12] = useState('12');
  const [minute, setMinute] = useState('00');
  const [nonce, setNonce] = useState(0);

  // Sync state when modal becomes visible or initial values change
  React.useEffect(() => {
    if (visible) {
      const h24 = parseInt(initialHour24);
      setAmpm(h24 >= 12 ? '오후' : '오전');
      setH12((h24 % 12 || 12).toString());
      
      const m = parseInt(initialMinute);
      const snappedM = (Math.round(m / 5) * 5 % 60).toString().padStart(2, '0');
      setMinute(snappedM);
      setNonce(n => n + 1); // Force pickers to re-mount/reset
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
            {/* AM/PM */}
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
            
            {/* Hour */}
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

            {/* Minute */}
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


export default function AddScheduleModal({ visible, onClose, onSave }: AddScheduleModalProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startHour, setStartHour] = useState('09');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMin, setEndMin] = useState('00');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title,
      description,
      start_time: `${startHour}:${startMin}`,
      end_time: `${endHour}:${endMin}`,
      color: selectedColor,
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

  const onConfirmPicker = (h: string, m: string) => {
    if (showPicker === 'start') {
      setStartHour(h);
      setStartMin(m);
    } else {
      setEndHour(h);
      setEndMin(m);
    }
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
        visible={!!showPicker}
        onClose={() => setShowPicker(null)}
        onConfirm={onConfirmPicker}
        initialHour24={showPicker === 'start' ? startHour : endHour}
        initialMinute={showPicker === 'start' ? startMin : endMin}
        title={showPicker === 'start' ? '시작 시간 선택' : '종료 시간 선택'}
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
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SPACING.md,
  },
  wheelItem: {
    justifyContent: 'center',
    alignItems: 'center',
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
  selectedWheelText: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: 'bold',
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
