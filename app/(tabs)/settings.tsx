import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, Pressable } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { Database, Cloud, HelpCircle, Info, RotateCcw, Moon, Sun, Monitor, ChevronRight, Check } from 'lucide-react-native';
import { clearAllData } from '../../src/services/database';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { BackupService } from '../../src/services/BackupService';
import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../src/context/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
  const lastProcessedCode = useRef<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/drive.appdata'],
    redirectUri: 'com.jplan.app:/settings',
  });

  const getThemeText = (mode: string) => {
    switch (mode) {
      case 'light': return '라이트 모드';
      case 'dark': return '다크 모드';
      case 'system': return '시스템 설정';
      default: return '시스템 설정';
    }
  };

  const getThemeIcon = (mode: string) => {
    switch (mode) {
      case 'light': return Sun;
      case 'dark': return Moon;
      case 'system': return Monitor;
      default: return Monitor;
    }
  };

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

    const result = await promptAsync();

    if (result?.type === 'success') {
      try {
        setIsBackupLoading(true);
        const { code } = result.params;
        
        // [중복 요청 방지] 이미 처리된 code라면 중복으로 토큰 교환을 요청하지 않습니다.
        if (code === lastProcessedCode.current) {
          console.log('이미 처리된 인증 코드입니다. 중복 요청을 차단합니다.');
          return;
        }
        lastProcessedCode.current = code;
        
        // [핵심] 번호표(code)를 진짜 토큰으로 교환합니다.
        const tokenResponse = await AuthSession.exchangeCodeAsync({
          clientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID || '',
          code,
          redirectUri: 'com.jplan.app:/settings',
          extraParams: request?.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
        }, Google.discovery);

        if (tokenResponse.accessToken) {
          if (action === 'backup') {
            await executeBackup(tokenResponse.accessToken);
          } else {
            Alert.alert(
              '데이터 복원',
              '기존 데이터를 구글 드라이브에 저장된 데이터로 덮어씌웁니다. 계속하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                { text: '복원', onPress: () => executeRestore(tokenResponse.accessToken) }
              ]
            );
          }
        }
      } catch (error: any) {
        Alert.alert('토큰 교환 실패', error.message || '인증 정보를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setIsBackupLoading(false);
      }
    }
  };

  const MenuItem = ({ icon: Icon, title, subtitle, onPress, rightText }: any) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
        <Icon color={colors.primary} size={22} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <View style={styles.rightContent}>
        {rightText && <Text style={[styles.rightText, { color: colors.textSecondary }]}>{rightText}</Text>}
        <ChevronRight color={colors.border} size={20} />
      </View>
    </TouchableOpacity>
  );

  const ThemeSelectionModal = () => (
    <Modal
      visible={isThemeModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setIsThemeModalVisible(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setIsThemeModalVisible(false)}
      >
        <Pressable
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
          onPress={() => { }} // Prevent closing when clicking content
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>테마 설정</Text>
          </View>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => { setThemeMode('light'); setIsThemeModalVisible(false); }}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.background }]}>
              <Sun color={colors.primary} size={20} />
            </View>
            <Text style={[styles.optionText, { color: colors.text }]}>라이트 모드</Text>
            {themeMode === 'light' && <Check color={colors.primary} size={20} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => { setThemeMode('dark'); setIsThemeModalVisible(false); }}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.background }]}>
              <Moon color={colors.primary} size={20} />
            </View>
            <Text style={[styles.optionText, { color: colors.text }]}>다크 모드</Text>
            {themeMode === 'dark' && <Check color={colors.primary} size={20} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => { setThemeMode('system'); setIsThemeModalVisible(false); }}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.background }]}>
              <Monitor color={colors.primary} size={20} />
            </View>
            <Text style={[styles.optionText, { color: colors.text }]}>시스템 설정</Text>
            {themeMode === 'system' && <Check color={colors.primary} size={20} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.background }]}
            onPress={() => setIsThemeModalVisible(false)}
          >
            <Text style={[styles.closeButtonText, { color: colors.text }]}>닫기</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
    >

      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>백업 및 데이터</Text>
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
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>화면 설정</Text>
        <MenuItem
          icon={getThemeIcon(themeMode)}
          title="테마 설정"
          rightText={getThemeText(themeMode)}
          onPress={() => setIsThemeModalVisible(true)}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>정보</Text>
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

      <ThemeSelectionModal />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  rightText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
