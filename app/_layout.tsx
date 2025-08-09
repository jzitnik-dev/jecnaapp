import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { AppState, ActivityIndicator, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SpseJecnaClient } from '../api/SpseJecnaClient';
import { NotificationProvider } from '../components/NotificationProvider';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSpseJecnaClient } from '../hooks/useSpseJecnaClient';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 5, // total 5 retries
      retryDelay: attemptIndex => Math.min(100 * 2 ** attemptIndex, 10000), // start at 100ms, max 10s
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { client, setClient } = useSpseJecnaClient();
  const { currentTheme, navigationTheme, loadThemeSettings } = useAppTheme();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [isLoading, setIsLoading] = useState(true); // 👈 Loading state

  useEffect(() => {
    const loadTheme = async () => {
      try {
        await loadThemeSettings();
      } catch (error) {
        console.error('Error loading theme settings:', error);
      }
    };
    loadTheme();
  }, [loadThemeSettings]);

  useEffect(() => {
    const initializeClient = async () => {
      const activeClient = client ?? new SpseJecnaClient();
      if (!client) setClient(activeClient);

      try {
        const isLoggedIn = await activeClient.isLoggedIn();
        if (!isLoggedIn) {
          const savedUsername = await SecureStore.getItemAsync('username');
          const savedPassword = await SecureStore.getItemAsync('password');

          if (savedUsername && savedPassword) {
            try {
              await activeClient.login(savedUsername, savedPassword);
              console.log('Auto-login successful');
            } catch (error) {
              console.log('Auto-login failed:', error);
              await SecureStore.deleteItemAsync('username');
              await SecureStore.deleteItemAsync('password');
              router.replace('/login');
            }
          } else {
            router.replace('/login');
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Run once at mount
    initializeClient();

    // Run when app comes to foreground
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        initializeClient();
      }
    });

    return () => subscription.remove();
  }, [client, setClient, router]);

  if (fontError) {
    console.error('Font loading error:', fontError);
  }

  const shouldWaitForFonts = __DEV__;
  if ((shouldWaitForFonts && !fontsLoaded) || isLoading) {
    // 👇 Full-screen spinner
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const hybridTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...navigationTheme.colors,
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={currentTheme}>
        <ThemeProvider value={hybridTheme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <NotificationProvider>
              <Stack>
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </NotificationProvider>
          </GestureHandlerRootView>
        </ThemeProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
