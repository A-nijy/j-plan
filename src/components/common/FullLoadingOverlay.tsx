import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Modal, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';
import { AlertCircle, X } from 'lucide-react-native';

interface FullLoadingOverlayProps {
  visible: boolean;
  message?: string;
  onForceClose?: () => void;
}

const TIMEOUT_MS = 30000; // 30 seconds

export default function FullLoadingOverlay({ visible, message = '작업을 수행 중입니다...', onForceClose }: FullLoadingOverlayProps) {
  const { colors } = useTheme();
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (visible) {
      setIsTimedOut(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      timer = setTimeout(() => {
        setIsTimedOut(true);
      }, TIMEOUT_MS);
    } else {
      setIsTimedOut(false);
      fadeAnim.setValue(0);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.backdrop, 
            { opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.7] }) }
          ]} 
        />
        
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          {!isTimedOut ? (
            <>
              <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
              <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
              <Text style={[styles.subMessage, { color: colors.textSecondary }]}>잠시만 기다려 주세요.</Text>
            </>
          ) : (
            <>
              <View style={[styles.errorIconContainer, { backgroundColor: colors.error + '20' }]}>
                <AlertCircle size={32} color={colors.error} />
              </View>
              <Text style={[styles.errorTitle, { color: colors.text }]}>연결 요청 시간 초과</Text>
              <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
                네트워크 연결이 불안정합니다.{"\n"}잠시 후 다시 시도해 주세요.
              </Text>
              
              {onForceClose && (
                <TouchableOpacity 
                  style={[styles.closeButton, { backgroundColor: colors.primary }]} 
                  onPress={onForceClose}
                >
                  <X size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.closeButtonText}>닫기</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  content: {
    width: '100%',
    maxWidth: 320,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  spinner: {
    marginBottom: SPACING.lg,
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    width: '100%',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
