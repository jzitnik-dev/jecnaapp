import { ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SpseJecnaClient } from '../api/SpseJecnaClient';
import { NotificationProvider } from '../components/NotificationProvider';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSpseJecnaClient } from '../hooks/useSpseJecnaClient';

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { client, setClient } = useSpseJecnaClient();
  const { currentTheme, navigationTheme, loadThemeSettings } = useAppTheme();
  const router = useRouter();
  
  // Load fonts with better error handling - make it optional
  const [fontsLoaded, fontError] = useFonts({
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

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
      const newClient = new SpseJecnaClient();
      setClient(newClient);
      
      const isLoggedIn = await newClient.isLoggedIn();
      if (isLoggedIn) {
        console.log("User is already logged in");
        return;
      }

      const savedUsername = await SecureStore.getItemAsync('username');
      const savedPassword = await SecureStore.getItemAsync('password');
      if (savedUsername && savedPassword) {
        try {
          await newClient.login(savedUsername, savedPassword);
          console.log("Auto-login successful");
        } catch (error) {
          console.log("Auto-login failed:", error);
          // Clear invalid credentials
          await SecureStore.deleteItemAsync('username');
          await SecureStore.deleteItemAsync('password');
        }
      } else {
        // Redirect to login
        router.replace("/login");
      }
    };

    if (!client) {
      initializeClient();
    }
  }, [client, setClient]);

  // Log font errors but don't block the app
  if (fontError) {
    console.error('Font loading error:', fontError);
  }

  // Don't wait for fonts to load in production, only in development
  const shouldWaitForFonts = __DEV__;

  if (shouldWaitForFonts && !fontsLoaded) {
    return null;
  }

  // Create a hybrid theme that extends the default React Navigation theme
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
