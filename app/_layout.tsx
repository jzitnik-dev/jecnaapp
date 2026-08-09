import { ThemeProvider, DarkTheme } from 'expo-router/react-navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppTheme } from '../hooks/useAppTheme';
import { queryClient } from '@/utils/queryClient';
import { getItemAsync } from 'expo-secure-store';
import JecnaRozvrhClientManager from '@/components/JecnaRozvrhClientManager';
import { Canteen, JecnaAPI } from '@jzitnik/jecnaapi-react-native';
import {
  consumeNotifications,
  useNotificationListener,
} from '@/services/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { currentTheme, navigationTheme, loadThemeSettings } = useAppTheme();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useNotificationListener();

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
      try {
        const u = await getItemAsync('username');
        const p = await getItemAsync('password');

        if (u && p) {
          const loggedIn = await JecnaAPI.login(u, p);
          await Canteen.login(u, p);
          if (loggedIn) {
            if (!consumeNotifications()) {
              // No notification so redirect to dashboard
              router.replace('/');
            }
          } else {
            router.replace('/login');
          }
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Initialization error:', error);
        router.replace('/login');
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    initializeClient();
  }, [router]);

  const hybridTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      ...navigationTheme.colors,
    },
  };

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={currentTheme}>
        <ThemeProvider value={hybridTheme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <JecnaRozvrhClientManager />
            <Stack>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="drawer" options={{ headerShown: false }} />
              <Stack.Screen name="tabs" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </GestureHandlerRootView>
        </ThemeProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
