import React, { useRef } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView, Dimensions, Animated, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import { X } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HowToUseModalProps {
  visible: boolean;
  onClose: () => void;
}

const GUIDE_DATA = [
  {
    title: '오늘의 일정 관리',
    description: '원형 시간표와 목록을 통해 오늘의 일정을 한눈에 파악하고 수행도를 체크하세요.',
    image: require('../../assets/guide/guide_1.png'),
    color: '#6366F1',
  },
  {
    title: '항목 편집 및 관리',
    description: '드래그로 순서를 바꾸고, 밀어서 삭제하세요. 터치하면 상세 정보를 수정할 수 있습니다.',
    image: require('../../assets/guide/guide_2.png'),
    color: '#8B5CF6',
  },
  {
    title: '주간 일정표 활용',
    description: '달력에서 주간 진행도를 확인하고, 특정 날짜를 터치해 상세 시간표를 확인하세요.',
    image: require('../../assets/guide/guide_3.png'),
    color: '#10B981',
  },
  {
    title: '할 일 및 기록 확인',
    description: '할 일의 연속 수행 기록(스트릭)을 확인하고, 지난 성취 기록을 달력으로 되돌아보세요.',
    image: require('../../assets/guide/guide_4.png'),
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>앱 사용 가이드</Text>
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
                <View style={[styles.imageWrapper, { backgroundColor: colors.background }]}>
                  <Image 
                    source={item.image} 
                    style={styles.guideImage} 
                    resizeMode="contain" 
                  />
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
    maxHeight: 600, // 이미지를 위해 높이를 약간 상향 조정
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
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1, // 정사각형 비율 유지
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  guideImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
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
    marginBottom: SPACING.md,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
