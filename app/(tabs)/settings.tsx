import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { Database, Cloud, HelpCircle, Info } from 'lucide-react-native';
import { clearAllData } from '../../src/services/database';

export default function SettingsScreen() {
  const handleReset = async () => {
    Alert.alert(
      '데이터 초기화',
      '정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없으며 모든 일정과 루틴, 투두가 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '초기화', 
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllData();
            if (success) {
              Alert.alert('완료', '모든 데이터가 초기화되었습니다.');
            }
          }
        }
      ]
    );
  };

  const MenuItem = ({ icon: Icon, title, subtitle, onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Icon color={COLORS.primary} size={24} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>백업 및 데이터</Text>
        <MenuItem 
          icon={Cloud} 
          title="Google Drive 백업" 
          subtitle="현재 데이터를 구글 드라이브에 저장합니다."
          onPress={() => Alert.alert('알림', '준비 중인 기능입니다.')}
        />
        <MenuItem 
          icon={Database} 
          title="데이터 초기화" 
          subtitle="모든 일정과 투두 데이터를 삭제합니다."
          onPress={handleReset}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>정보</Text>
        <MenuItem 
          icon={HelpCircle} 
          title="사용 방법" 
        />
        <MenuItem 
          icon={Info} 
          title="버전 정보" 
          subtitle="v1.0.0"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
