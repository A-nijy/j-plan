import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import WheelPicker from 'react-native-wheely';
import { useTheme } from '../../context/ThemeContext';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (hour24: string, minute: string) => void;
  initialHour24: string;
  initialMinute: string;
  title: string;
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES_60 = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

export const TimePickerModal = ({ visible, onClose, onConfirm, initialHour24, initialMinute, title }: TimePickerModalProps) => {
  const { colors } = useTheme();
  const [hour24, setHour24] = useState('09');
  const [minute, setMinute] = useState('00');
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (visible) {
      setHour24(initialHour24.padStart(2, '0'));
      
      const m = parseInt(initialMinute);
      const snappedM = (Math.round(m / 5) * 5 % 60).toString().padStart(2, '0');
      setMinute(snappedM);
      setNonce(n => n + 1);
    }
  }, [visible, initialHour24, initialMinute]);

  const handleConfirm = () => {
    onConfirm(hour24, minute);
  };

  const hourIdx = Math.max(0, HOURS_24.indexOf(hour24));
  const minIdx = Math.max(0, MINUTES_60.indexOf(minute));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.pickerOverlay}>
        <View style={[styles.pickerContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.pickerTitle, { color: colors.text }]}>{title}</Text>
          <View style={styles.pickerRow}>
            <View style={{ width: 80 }}>
              <WheelPicker
                key={`hour-${nonce}`}
                selectedIndex={hourIdx}
                options={HOURS_24}
                onChange={(index) => setHour24(HOURS_24[index])}
                itemTextStyle={StyleSheet.flatten([styles.wheelItemText, { color: colors.text }])}
                selectedIndicatorStyle={StyleSheet.flatten([styles.wheelIndicator, { borderColor: colors.border }])}
                itemHeight={44}
              />
            </View>
            <Text style={[styles.separator, { color: colors.text }]}>:</Text>
            <View style={{ width: 80 }}>
              <WheelPicker
                key={`min-${nonce}`}
                selectedIndex={minIdx}
                options={MINUTES_60}
                onChange={(index) => setMinute(MINUTES_60[index])}
                itemTextStyle={StyleSheet.flatten([styles.wheelItemText, { color: colors.text }])}
                selectedIndicatorStyle={StyleSheet.flatten([styles.wheelIndicator, { borderColor: colors.border }])}
                itemHeight={44}
              />
            </View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmButtonSmall, { backgroundColor: colors.primary }]} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>확인</Text>
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
  pickerContent: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '85%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  wheelItemText: {
    fontSize: 18,
  },
  wheelIndicator: {
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  separator: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
  },
  confirmButtonSmall: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
