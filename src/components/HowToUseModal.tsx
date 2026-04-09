import React, { useRef } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import { X, Clock, Repeat, CheckSquare, Cloud } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HowToUseModalProps {
  visible: boolean;
  onClose: () => void;
}

const GUIDE_DATA = [
  {
    title: '나만의 원형 일정',
    description: '하루 24시간을 직관적인 원형 시계로 관리해 보세요. 주간 설정을 통해 매일 혹은 특정 요일의 일정을 미리 채울 수 있습니다.',
    icon: Clock,
    color: '#6366F1',
  },
  {
    title: '지속적인 루틴',
    description: '공부, 운동 등 꾸준히 반복해야 할 일들을 루틴으로 등록하세요. 완료한 루틴은 하단 완료 목록에서 확인할 수 있습니다.',
    icon: Repeat,
    color: '#8B5CF6',
  },
  {
    title: '스마트한 투두',
    description: '그날그날의 할 일을 추가하고 관리하세요. 미완료된 투두는 복원 기능을 통해 다음 날로 간편하게 옮길 수 있습니다.',
    icon: CheckSquare,
    color: '#10B981',
  },
  {
    title: '데이터 안전 백업',
    description: '소중한 기록들을 구글 드라이브에 안전하게 보관하세요. 기기를 변경해도 언제든 이전 데이터를 불러올 수 있습니다.',
    icon: Cloud,
    color: '#3B82F6',
  },
];

export default function HowToUseModal({ visible, onClose }: HowToUseModalProps) {
  const { colors } = useTheme();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>사용 방법 안내</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            {GUIDE_DATA.map((item, index) => (
              <View key={index} style={styles.slide}>
                <View style={[styles.iconWrapper, { backgroundColor: item.color + '15' }]}>
                  <item.icon size={60} color={item.color} strokeWidth={1.5} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.indicatorContainer}>
              {GUIDE_DATA.map((_, index) => {
                const width = scrollX.interpolate({
                  inputRange: [
                    (index - 1) * (SCREEN_WIDTH - SPACING.xl * 2),
                    index * (SCREEN_WIDTH - SPACING.xl * 2),
                    (index + 1) * (SCREEN_WIDTH - SPACING.xl * 2),
                  ],
                  outputRange: [8, 20, 8],
                  extrapolate: 'clamp',
                });
                const opacity = scrollX.interpolate({
                  inputRange: [
                    (index - 1) * (SCREEN_WIDTH - SPACING.xl * 2),
                    index * (SCREEN_WIDTH - SPACING.xl * 2),
                    (index + 1) * (SCREEN_WIDTH - SPACING.xl * 2),
                  ],
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: 'clamp',
                });
                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.indicator,
                      { width, opacity, backgroundColor: colors.primary }
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  container: {
    width: '100%',
    maxHeight: 520,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  slide: {
    width: SCREEN_WIDTH - SPACING.xl * 2,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: SPACING.sm,
  },
  footer: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
