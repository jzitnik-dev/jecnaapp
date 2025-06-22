import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SpseJecnaClient } from '../api/SpseJecnaClient';
import { NotificationProvider } from '../components/NotificationProvider';
import { useSpseJecnaClient } from '../hooks/useSpseJecnaClient';

const queryClient = new QueryClient();

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#666',
    onPrimary: '#fff',
    background: '#000000',
    surface: '#121212',
    surfaceVariant: '#1c1e24',
    secondary: '#1c1e24',
    onSecondary: '#fff',
    outline: '#666',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: '#000000',
      level1: '#121212',
      level2: '#121212',
      level3: '#121212',
      level4: '#121212',
      level5: '#121212',
    },
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { client, setClient } = useSpseJecnaClient();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

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
      }
    };

    if (!client) {
      initializeClient();
    }
  }, [client, setClient]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={customDarkTheme}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
