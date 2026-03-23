import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import WheelPicker from 'react-native-wheely';

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
        <View style={styles.pickerContent}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <View style={styles.pickerRow}>
            <View style={{ width: 80 }}>
              <WheelPicker
                key={`hour-${nonce}`}
                selectedIndex={hourIdx}
                options={HOURS_24}
                onChange={(index) => setHour24(HOURS_24[index])}
                itemTextStyle={styles.wheelItemText}
                selectedIndicatorStyle={styles.wheelIndicator}
                itemHeight={44}
              />
            </View>
            <Text style={styles.separator}>:</Text>
            <View style={{ width: 80 }}>
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

const styles = StyleSheet.create({
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '85%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.xl,
    textAlign: 'center',
    color: COLORS.text,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  wheelItemText: {
    fontSize: 18,
    color: COLORS.text,
  },
  wheelIndicator: {
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  separator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
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
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
