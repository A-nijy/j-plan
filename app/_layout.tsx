import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from '../src/services/database';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import * as SystemUI from 'expo-system-ui';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

function RootLayoutContent() {
  const [dbReady, setDbReady] = useState(false);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    initDatabase()
      .then(() => {
        setDbReady(true);
        console.log('Database initialized successfully');
      })
      .catch(err => {
        console.error('Database initialization failed', err);
      });
  }, []);

  useEffect(() => {
    // Set system-wide background color to match theme
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colors.background }
        }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
