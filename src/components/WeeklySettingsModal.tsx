import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import { WeeklySettings, WeeklySettingsService } from '../services/WeeklySettingsService';
import { X, Clock } from 'lucide-react-native';
import { TimePickerModal } from './common/TimePickerModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface WeeklySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: WeeklySettings;
  onSave: () => void;
}

const INTERVALS = [
  { label: '1시간', value: 60 },
  { label: '30분', value: 30 },
  { label: '20분', value: 20 },
  { label: '10분', value: 10 },
];

const VIEW_MODES = [
  { label: '기본 (달력+시간표)', value: 'combined' },
  { label: '시간표만 크게 보기', value: 'expanded' },
];

export const WeeklySettingsModal: React.FC<WeeklySettingsModalProps> = ({ visible, onClose, settings, onSave }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [localSettings, setLocalSettings] = useState<WeeklySettings>(settings);
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const handleUpdate = (updates: Partial<WeeklySettings>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    await WeeklySettingsService.updateSettings(localSettings);
    onSave();
    onClose();
  };

  const onConfirmHours = (h: string, m: string) => {
    const hour = parseInt(h);
    if (showPicker === 'start') {
      handleUpdate({ start_hour: hour });
    } else {
      handleUpdate({ end_hour: hour });
    }
    setShowPicker(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={[
          styles.content, 
          { 
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + SPACING.lg,
            maxHeight: Dimensions.get('window').height - insets.top - SPACING.xl
          }
        ]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>주간 시간표 설정</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {/* View Mode */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>보기 모드</Text>
              <View style={styles.buttonGroupVertical}>
                {VIEW_MODES.map(mode => (
                  <TouchableOpacity
                    key={mode.value}
                    style={[
                      styles.modeButton,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      localSettings.view_mode === mode.value && [styles.activeButton, { backgroundColor: colors.primary, borderColor: colors.primary }]
                    ]}
                    onPress={() => handleUpdate({ view_mode: mode.value as any })}
                  >
                    <Text style={[
                      styles.buttonText,
                      { color: colors.text },
                      localSettings.view_mode === mode.value && [styles.activeButtonText, { color: colors.surface }]
                    ]}>
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Interval */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>시간 그리드 단위</Text>
              <View style={styles.buttonGroup}>
                {INTERVALS.map(interval => (
                  <TouchableOpacity
                    key={interval.value}
                    style={[
                      styles.optionButton,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      localSettings.grid_interval === interval.value && [styles.activeButton, { backgroundColor: colors.primary, borderColor: colors.primary }]
                    ]}
                    onPress={() => handleUpdate({ grid_interval: interval.value as any })}
                  >
                    <Text style={[
                      styles.buttonText,
                      { color: colors.text },
                      localSettings.grid_interval === interval.value && [styles.activeButtonText, { color: colors.surface }]
                    ]}>
                      {interval.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time Range */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>표시 시간 범위</Text>
              <View style={styles.rangeRow}>
                <View style={styles.flex1}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>시작 시간</Text>
                  <TouchableOpacity 
                    style={[styles.timeInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setShowPicker('start')}
                  >
                    <Clock size={16} color={colors.textSecondary} />
                    <Text style={[styles.timeText, { color: colors.text }]}>{localSettings.start_hour.toString().padStart(2, '0')}:00</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ width: SPACING.md }} />
                <View style={styles.flex1}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>종료 시간</Text>
                  <TouchableOpacity 
                    style={[styles.timeInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setShowPicker('end')}
                  >
                    <Clock size={16} color={colors.textSecondary} />
                    <Text style={[styles.timeText, { color: colors.text }]}>{localSettings.end_hour.toString().padStart(2, '0')}:00</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {localSettings.start_hour >= localSettings.end_hour && (
                <Text style={styles.errorText}>종료 시간은 시작 시간보다 늦어야 합니다.</Text>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={[
              styles.saveButton, 
              { backgroundColor: colors.primary },
              localSettings.start_hour >= localSettings.end_hour && { backgroundColor: colors.border }
            ]} 
            onPress={handleSave}
            disabled={localSettings.start_hour >= localSettings.end_hour}
          >
            <Text style={[styles.saveButtonText, { color: colors.surface }]}>적용하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TimePickerModal
        visible={showPicker !== null}
        onClose={() => setShowPicker(null)}
        onConfirm={onConfirmHours}
        initialHour24={(showPicker === 'start' ? localSettings.start_hour : localSettings.end_hour).toString().padStart(2, '0')}
        initialMinute="00"
        title={showPicker === 'start' ? '시작 시간 설정' : '종료 시간 설정'}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  body: {
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  buttonGroupVertical: {
    gap: SPACING.sm,
  },
  optionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  modeButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  activeButton: {
  },
  buttonText: {
    fontSize: 14,
  },
  activeButtonText: {
    fontWeight: 'bold',
  },
  rangeRow: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  timeText: {
    marginLeft: SPACING.sm,
    fontSize: 14,
  },
  saveButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#FFADAD',
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});
