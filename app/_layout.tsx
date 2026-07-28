import { ThemeProvider, DarkTheme } from 'expo-router/react-navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotificationProvider } from '../components/NotificationProvider';
import { useAppTheme } from '../hooks/useAppTheme';
import { queryClient } from '@/utils/queryClient';
import { getItemAsync } from 'expo-secure-store';
import JecnaRozvrhClientManager from '@/components/JecnaRozvrhClientManager';
import { JecnaAPI } from 'jecnaapi-react-native';

export default function RootLayout() {
  const { currentTheme, navigationTheme, loadThemeSettings } = useAppTheme();
  const router = useRouter();

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
      const u = await getItemAsync('username');
      const p = await getItemAsync('password');

      if (u && p) {
        const res = await JecnaAPI.login(u, p);
        if (res) {
          router.push('/(tabs)/drawer');
        } else {
          router.push('/login'); // TODO
        }
      } else {
        router.push('/login');
      }

      try {
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    // Run once at mount
    initializeClient();

    // Run when app comes to foreground
    // const subscription = AppState.addEventListener('change', state => {
    //   if (state === 'active') {
    //     initializeClient();
    //   }
    // });

    // return () => subscription.remove();
  }, []);

  const hybridTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      ...navigationTheme.colors,
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={currentTheme}>
        <ThemeProvider value={hybridTheme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <NotificationProvider>
              <JecnaRozvrhClientManager />
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
