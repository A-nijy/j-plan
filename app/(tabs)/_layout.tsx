import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Calendar, CheckSquare, Settings, Repeat } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          elevation: 0, // Remove Android shadow
          shadowOpacity: 0, // Remove iOS shadow
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.text,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '오늘',
          headerTitle: '오늘의 일정',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="weekly"
        options={{
          title: '주간',
          headerTitle: '주간 일정표',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          title: '루틴',
          headerTitle: '루틴 관리',
          tabBarIcon: ({ color, size }) => <Repeat color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: '투두',
          headerTitle: '할 일 관리',
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          headerTitle: '환경 설정',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
