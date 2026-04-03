import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Animated, TouchableOpacity } from 'react-native';
import { Info, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface OnboardingTooltipProps {
  type: 'swipe' | 'drag';
  visible: boolean;
  onClose: () => void;
}

const STORAGE_KEY_PREFIX = 'tooltip_seen_';

export default function OnboardingTooltip({ type, visible, onClose }: OnboardingTooltipProps) {
  const { colors } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(async () => {
      await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${type}`, 'true');
      onClose();
    });
  };

  if (!visible) return null;

  const getMessage = () => {
    switch (type) {
      case 'swipe':
        return '항목을 왼쪽으로 밀면 삭제 버튼이 나타납니다.';
      case 'drag':
        return '항목을 길게 눌러 자유롭게 순서를 변경할 수 있습니다.';
      default:
        return '';
    }
  };

  return (
    <Animated.View style={[
      styles.container, 
      { opacity: fadeAnim, shadowColor: colors.text }
    ]}>
      <View style={[styles.content, { backgroundColor: colors.surface, borderColor: colors.primary + '50' }]}>
        <Info color={colors.primary} size={20} style={styles.icon} />
        <Text style={[styles.text, { color: colors.text }]}>{getMessage()}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <X color={colors.textSecondary} size={18} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 1000,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 10,
  },
});
