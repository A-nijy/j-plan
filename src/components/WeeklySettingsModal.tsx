import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { WeeklySettings, WeeklySettingsService } from '../services/WeeklySettingsService';
import { X } from 'lucide-react-native';

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

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const WeeklySettingsModal: React.FC<WeeklySettingsModalProps> = ({ visible, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<WeeklySettings>(settings);

  const handleUpdate = (updates: Partial<WeeklySettings>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    await WeeklySettingsService.updateSettings(localSettings);
    onSave();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>주간 시간표 설정</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {/* View Mode */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>보기 모드</Text>
              <View style={styles.buttonGroupVertical}>
                {VIEW_MODES.map(mode => (
                  <TouchableOpacity
                    key={mode.value}
                    style={[
                      styles.modeButton,
                      localSettings.view_mode === mode.value && styles.activeButton
                    ]}
                    onPress={() => handleUpdate({ view_mode: mode.value as any })}
                  >
                    <Text style={[
                      styles.buttonText,
                      localSettings.view_mode === mode.value && styles.activeButtonText
                    ]}>
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Interval */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>시간 그리드 단위</Text>
              <View style={styles.buttonGroup}>
                {INTERVALS.map(interval => (
                  <TouchableOpacity
                    key={interval.value}
                    style={[
                      styles.optionButton,
                      localSettings.grid_interval === interval.value && styles.activeButton
                    ]}
                    onPress={() => handleUpdate({ grid_interval: interval.value as any })}
                  >
                    <Text style={[
                      styles.buttonText,
                      localSettings.grid_interval === interval.value && styles.activeButtonText
                    ]}>
                      {interval.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>표시 시간 범위</Text>
              <View style={styles.rangeRow}>
                <View style={styles.pickerCol}>
                  <Text style={styles.label}>시작 시간</Text>
                  <ScrollView style={styles.hourList} nestedScrollEnabled>
                    {HOURS.map(h => (
                      <TouchableOpacity
                        key={h}
                        style={[styles.hourItem, localSettings.start_hour === h && styles.activeHour]}
                        onPress={() => handleUpdate({ start_hour: h })}
                      >
                        <Text style={[styles.hourText, localSettings.start_hour === h && styles.activeHourText]}>
                          {h}:00
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.pickerCol}>
                  <Text style={styles.label}>종료 시간</Text>
                  <ScrollView style={styles.hourList} nestedScrollEnabled>
                    {HOURS.map(h => (
                      <TouchableOpacity
                        key={h}
                        style={[styles.hourItem, localSettings.end_hour === h && styles.activeHour]}
                        onPress={() => handleUpdate({ end_hour: h })}
                      >
                        <Text style={[styles.hourText, localSettings.end_hour === h && styles.activeHourText]}>
                          {h}:00
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
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
              localSettings.start_hour >= localSettings.end_hour && styles.disabledButton
            ]} 
            onPress={handleSave}
            disabled={localSettings.start_hour >= localSettings.end_hour}
          >
            <Text style={styles.saveButtonText}>적용하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '80%',
    padding: SPACING.lg,
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
    color: COLORS.text,
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
    color: COLORS.text,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 14,
  },
  activeButtonText: {
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  rangeRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    height: 150,
  },
  pickerCol: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  hourList: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hourItem: {
    padding: SPACING.sm,
    alignItems: 'center',
  },
  activeHour: {
    backgroundColor: COLORS.primary + '15',
  },
  hourText: {
    fontSize: 14,
    color: COLORS.text,
  },
  activeHourText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.border,
  },
  saveButtonText: {
    color: COLORS.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#FFADAD',
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});
