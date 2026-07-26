import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from 'expo-router/react-navigation';
import { AppState } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SpseJecnaClient } from '../api/SpseJecnaClient';
import { NotificationProvider } from '../components/NotificationProvider';
import { useAppTheme } from '../hooks/useAppTheme';
import { useSpseJecnaClient } from '../hooks/useSpseJecnaClient';
import { queryClient } from '@/utils/queryClient';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { client, setClient } = useSpseJecnaClient();
  const { currentTheme, navigationTheme, loadThemeSettings } = useAppTheme();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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
      const activeClient = client ?? new SpseJecnaClient();
      if (!client) setClient(activeClient);

      const tryLoginWithRetry = async (
        username: string,
        password: string,
        maxRetries = 20
      ) => {
        let attempt = 0;
        while (attempt < maxRetries) {
          try {
            await activeClient.login(username, password);
            return true; // success
          } catch (error) {
            attempt++;
            console.log(`Auto-login failed (attempt ${attempt}):`, error);

            if (attempt >= maxRetries) return false;

            // Exponential backoff: 500ms, 1s, 2s, 4s, ...
            const delay = 500 * Math.pow(2, Math.max(attempt - 1, 5));
            await new Promise(res => setTimeout(res, delay));
          }
        }
        return false;
      };

      try {
        const isLoggedIn = await activeClient.isLoggedIn();
        if (!isLoggedIn) {
          const savedUsername = await SecureStore.getItemAsync('username');
          const savedPassword = await SecureStore.getItemAsync('password');

          if (savedUsername && savedPassword) {
            const success = await tryLoginWithRetry(
              savedUsername,
              savedPassword
            );

            if (!success) {
              console.log(
                'Auto-login ultimately failed, redirecting to login.'
              );
              router.replace('/login');
            }
          } else {
            router.replace('/login');
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
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
  }, []);

  if (fontError) {
    console.error('Font loading error:', fontError);
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
