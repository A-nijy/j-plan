import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, View, I18nManager, TouchableOpacity, Alert } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { COLORS, SPACING } from '../../constants/theme';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onPress?: () => void;
}

export default function SwipeableRow({ children, onDelete, onPress }: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
    });

    const handleDelete = () => {
      swipeableRef.current?.close();
      Alert.alert(
        '삭제 확인',
        '정말로 이 항목을 삭제하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '삭제', style: 'destructive', onPress: onDelete },
        ]
      );
    };

    return (
      <View style={{ width: 80, flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}>
        <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
          <RectButton
            style={[styles.rightAction, { backgroundColor: COLORS.error }]}
            onPress={handleDelete}
          >
            <Trash2 color="#FFFFFF" size={24} />
            <Text style={styles.actionText}>삭제</Text>
          </RectButton>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      enableTrackpadTwoFingerGesture
      leftThreshold={30}
      rightThreshold={40}
      renderRightActions={renderRightActions}
    >
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={onPress}
        disabled={!onPress}
      >
        {children}
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rightAction: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
