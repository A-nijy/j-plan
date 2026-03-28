import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { Database, Cloud, HelpCircle, Info, RotateCcw } from 'lucide-react-native';
import { clearAllData } from '../../src/services/database';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { BackupService } from '../../src/services/BackupService';
import React, { useEffect, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

export default function SettingsScreen() {
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '861751141444-nnt7n7u7n7u7n7u7n7u7.apps.googleusercontent.com', // Placeholder
    iosClientId: '861751141444-nnt7n7u7n7u7n7u7n7u7.apps.googleusercontent.com', // Placeholder
    scopes: ['https://www.googleapis.com/auth/drive.appdata'],
  });

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

  const executeBackup = async (token: string) => {
    try {
      setIsBackupLoading(true);
      await BackupService.backup(token);
      Alert.alert('백업 성공', '데이터가 구글 드라이브에 안전하게 저장되었습니다.');
      // Update last backup info
      const info = await BackupService.findBackupFile(token);
      if (info) setLastBackupTime(new Date(info.modifiedTime).toLocaleString('ko-KR'));
    } catch (error: any) {
      Alert.alert('백업 실패', error.message || '백업 중 오류가 발생했습니다.');
    } finally {
      setIsBackupLoading(false);
    }
  };

  const executeRestore = async (token: string) => {
    try {
      setIsBackupLoading(true);
      await BackupService.restore(token);
      Alert.alert(
        '복원 성공', 
        '데이터 복원이 완료되었습니다. 앱의 최신 상태를 반영하기 위해 앱을 재시작해 주세요.',
        [{ text: '확인' }]
      );
    } catch (error: any) {
      Alert.alert('복원 실패', error.message || '복원 중 오류가 발생했습니다.');
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleAuthAndAction = async (action: 'backup' | 'restore') => {
    if (isBackupLoading) return;

    // In a real app, you would check if token is already present or valid
    // For simplicity, we prompt for login every time or use the hook response
    const result = await promptAsync();
    
    if (result?.type === 'success') {
      const { authentication } = result;
      if (authentication?.accessToken) {
        if (action === 'backup') {
          await executeBackup(authentication.accessToken);
        } else {
          Alert.alert(
            '데이터 복원',
            '기존 데이터를 구글 드라이브에 저장된 데이터로 덮어씌웁니다. 계속하시겠습니까?',
            [
              { text: '취소', style: 'cancel' },
              { text: '복원', onPress: () => executeRestore(authentication.accessToken) }
            ]
          );
        }
      }
    }
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
          subtitle={isBackupLoading ? "진행 중..." : (lastBackupTime ? `최근 백업: ${lastBackupTime}` : "데이터를 구글 드라이브에 저장")}
          onPress={() => handleAuthAndAction('backup')}
        />
        <MenuItem 
          icon={RotateCcw} 
          title="Google Drive 복원" 
          subtitle="드라이브 백업 데이터로 복원합니다."
          onPress={() => handleAuthAndAction('restore')}
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
