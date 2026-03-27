import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, View, I18nManager, TouchableOpacity, Alert } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteText?: string;
  deleteConfirmMessage?: string;
  containerStyle?: any;
}

export default function SwipeableRow({ 
  children, 
  onDelete, 
  deleteText = '삭제',
  deleteConfirmMessage = '정말로 이 항목을 삭제하시겠습니까?',
  containerStyle
}: SwipeableRowProps) {
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
        deleteConfirmMessage,
        [
          { text: '취소', style: 'cancel' },
          { text: '삭제', style: 'destructive', onPress: onDelete },
        ]
      );
    };

    return (
      <View style={styles.rightActionContainer}>
        <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
          <RectButton
            style={[styles.rightAction, { backgroundColor: COLORS.error }]}
            onPress={handleDelete}
          >
            <Trash2 color="#FFFFFF" size={24} />
            <Text style={styles.actionText}>{deleteText}</Text>
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
      containerStyle={[styles.defaultContainer, containerStyle]}
      childrenContainerStyle={styles.childrenContainer}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  defaultContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  childrenContainer: {
    backgroundColor: 'transparent',
  },
  rightActionContainer: {
    width: 80,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
  rightAction: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
