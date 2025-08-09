import * as SecureStore from 'expo-secure-store';
import { MD3DarkTheme } from 'react-native-paper';
import { create } from 'zustand';

interface ThemeColors {
  primary: string;
  onPrimary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  card: string;
  text: string;
  border: string;
  notification: string;
}

interface Theme {
  name: string;
  description: string;
  colors: ThemeColors;
}

const predefinedThemes: Theme[] = [
  {
    name: 'Výchozí',
    description: 'Tmavé téma se zeleným akcentem',
    colors: {
      primary: '#4caf50',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      surfaceVariant: '#2a2a2a',
      onSurface: '#ffffff',
      onSurfaceVariant: '#b3b3b3',
      card: '#1a1a1a',
      text: '#ffffff',
      border: '#4caf50',
      notification: '#4caf50',
      onPrimary: '#000000',
    },
  },
  {
    name: 'Světlé',
    description: 'Světlé téma s modrým akcentem',
    colors: {
      primary: '#1976d2',
      background: '#ffffff',
      surface: '#f5f5f5',
      surfaceVariant: '#e3f2fd',
      onSurface: '#000000',
      onSurfaceVariant: '#666666',
      card: '#ffffff',
      text: '#000000',
      border: '#e0e0e0',
      notification: '#1976d2',
      onPrimary: '#000000',
    },
  },
  {
    name: 'Černobílé',
    description: 'Minimalistické černobílé téma',
    colors: {
      primary: '#000000',
      background: '#ffffff',
      surface: '#f8f8f8',
      surfaceVariant: '#f0f0f0',
      onSurface: '#000000',
      onSurfaceVariant: '#666666',
      card: '#ffffff',
      text: '#000000',
      border: '#000000',
      notification: '#000000',
      onPrimary: '#ffffff',
    },
  },
  {
    name: 'Tmavé černobílé',
    description: 'Minimalistické tmavé černobílé téma',
    colors: {
      primary: '#ffffff',
      background: '#000000',
      surface: '#111111',
      surfaceVariant: '#222222',
      onSurface: '#ffffff',
      onSurfaceVariant: '#cccccc',
      card: '#111111',
      text: '#ffffff',
      border: '#ffffff',
      notification: '#ffffff',
      onPrimary: '#000000',
    },
  },
  {
    name: 'Oranžové',
    description: 'Tmavé téma s oranžovým akcentem',
    colors: {
      primary: '#ff9800',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      surfaceVariant: '#2a2a2a',
      onSurface: '#ffffff',
      onSurfaceVariant: '#b3b3b3',
      card: '#1a1a1a',
      text: '#ffffff',
      border: '#ff9800',
      notification: '#ff9800',
      onPrimary: '#000000',
    },
  },
  {
    name: 'Červené',
    description: 'Tmavé téma s červeným akcentem',
    colors: {
      primary: '#f44336',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      surfaceVariant: '#2a2a2a',
      onSurface: '#ffffff',
      onSurfaceVariant: '#b3b3b3',
      card: '#1a1a1a',
      text: '#ffffff',
      border: '#f44336',
      notification: '#f44336',
      onPrimary: '#000000',
    },
  },
  {
    name: 'Modré',
    description: 'Tmavé téma s modrým akcentem',
    colors: {
      primary: '#2196f3',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      surfaceVariant: '#2a2a2a',
      onSurface: '#ffffff',
      onSurfaceVariant: '#b3b3b3',
      card: '#1a1a1a',
      text: '#ffffff',
      border: '#2196f3',
      notification: '#2196f3',
      onPrimary: '#000000',
    },
  },
  {
    name: 'Fialové',
    description: 'Tmavé téma s fialovým akcentem',
    colors: {
      primary: '#9c27b0',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      surfaceVariant: '#2a2a2a',
      onSurface: '#ffffff',
      onSurfaceVariant: '#b3b3b3',
      card: '#1a1a1a',
      text: '#ffffff',
      border: '#9c27b0',
      notification: '#9c27b0',
      onPrimary: '#000000',
    },
  },
  {
    name: 'Růžové',
    description: 'Tmavé téma s růžovým akcentem',
    colors: {
      primary: '#e91e63',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      surfaceVariant: '#2a2a2a',
      onSurface: '#ffffff',
      onSurfaceVariant: '#b3b3b3',
      card: '#1a1a1a',
      text: '#ffffff',
      border: '#e91e63',
      notification: '#e91e63',
      onPrimary: '#000000',
    },
  },
  {
    name: 'Teal',
    description: 'Tmavé téma s teal akcentem',
    colors: {
      primary: '#009688',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      surfaceVariant: '#2a2a2a',
      onSurface: '#ffffff',
      onSurfaceVariant: '#b3b3b3',
      card: '#1a1a1a',
      text: '#ffffff',
      border: '#009688',
      notification: '#009688',
      onPrimary: '#000000',
    },
  },
  {
    name: 'Amber',
    description: 'Tmavé téma s amber akcentem',
    colors: {
      primary: '#ffc107',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      surfaceVariant: '#2a2a2a',
      onSurface: '#ffffff',
      onSurfaceVariant: '#b3b3b3',
      card: '#1a1a1a',
      text: '#ffffff',
      border: '#ffc107',
      notification: '#ffc107',
      onPrimary: '#000000',
    },
  },
];

interface AppThemeState {
  selectedTheme: string;
  customColors: ThemeColors | null;
  useCustomColors: boolean;
  currentTheme: any;
  navigationTheme: any;
  setSelectedTheme: (themeName: string) => Promise<void>;
  setCustomColors: (colors: ThemeColors) => Promise<void>;
  setUseCustomColors: (enabled: boolean) => Promise<void>;
  loadThemeSettings: () => Promise<void>;
  getPredefinedThemes: () => Theme[];
  updateCurrentTheme: () => void;
}

export const useAppTheme = create<AppThemeState>((set, get) => ({
  selectedTheme: 'Default',
  customColors: null,
  useCustomColors: false,
  currentTheme: {},
  navigationTheme: {
    dark: true,
    colors: {
      primary: '#4caf50',
      background: '#0a0a0a',
      card: '#1a1a1a',
      text: '#ffffff',
      border: '#4caf50',
      notification: '#4caf50',
      onBackground: '#ffffff',
      onCard: '#ffffff',
      onPrimary: '#000000',
      onSurface: '#ffffff',
    },
  },

  setSelectedTheme: async (themeName: string) => {
    try {
      await SecureStore.setItemAsync('selectedTheme', themeName);
      set({ selectedTheme: themeName });
      get().updateCurrentTheme();
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },

  setCustomColors: async (colors: ThemeColors) => {
    try {
      await SecureStore.setItemAsync('customColors', JSON.stringify(colors));
      set({ customColors: colors });
      get().updateCurrentTheme();
    } catch (error) {
      console.error('Error saving custom colors:', error);
    }
  },

  setUseCustomColors: async (enabled: boolean) => {
    try {
      await SecureStore.setItemAsync('useCustomColors', enabled.toString());
      set({ useCustomColors: enabled });
      get().updateCurrentTheme();
    } catch (error) {
      console.error('Error saving custom colors setting:', error);
    }
  },

  loadThemeSettings: async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync('selectedTheme');
      const savedCustomColors = await SecureStore.getItemAsync('customColors');
      const savedUseCustomColors =
        await SecureStore.getItemAsync('useCustomColors');

      set({
        selectedTheme: savedTheme || 'Default',
        customColors: savedCustomColors ? JSON.parse(savedCustomColors) : null,
        useCustomColors: savedUseCustomColors === 'true',
      });

      get().updateCurrentTheme();
    } catch (error) {
      console.error('Error loading theme settings:', error);
      // Set default values if loading fails
      set({
        selectedTheme: 'Default',
        customColors: null,
        useCustomColors: false,
      });
      get().updateCurrentTheme();
    }
  },

  getPredefinedThemes: () => predefinedThemes,

  updateCurrentTheme: () => {
    try {
      const { selectedTheme, customColors, useCustomColors } = get();

      let themeColors: ThemeColors;

      if (useCustomColors && customColors) {
        themeColors = customColors;
      } else {
        const predefinedTheme = predefinedThemes.find(
          t => t.name === selectedTheme
        );
        themeColors = predefinedTheme?.colors || predefinedThemes[0].colors;
      }

      // Create a simple theme object without complex font structures
      const customPaperTheme = {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: themeColors.primary,
          background: themeColors.background,
          surface: themeColors.surface,
          surfaceVariant: themeColors.surfaceVariant,
          onSurfaceVariant: themeColors.onSurfaceVariant,
          onPrimary: themeColors.onPrimary,
          onSurface: themeColors.onSurface,
          onBackground: themeColors.text,
          elevation: {
            level0: themeColors.background,
            level1: themeColors.surface,
            level2: themeColors.surface,
            level3: themeColors.surface,
            level4: themeColors.surface,
            level5: themeColors.surface,
          },
        },
      };

      // Create navigation theme compatible with React Navigation v7
      const isDark = themeColors.background === '#000000';
      const customNavigationTheme = {
        dark: isDark,
        colors: {
          primary: themeColors.primary,
          background: themeColors.background,
          card: themeColors.card,
          text: themeColors.text,
          border: themeColors.border,
          notification: themeColors.notification,
          // Required properties for React Navigation v7
          onBackground: themeColors.text,
          onCard: themeColors.onSurface,
          onPrimary: themeColors.onPrimary,
          onSurface: themeColors.onSurface,
        },
      };

      set({
        currentTheme: customPaperTheme,
        navigationTheme: customNavigationTheme,
      });
    } catch (error) {
      console.error('Error updating theme:', error);
      // Fallback to default theme
      set({
        currentTheme: MD3DarkTheme,
        navigationTheme: {
          dark: true,
          colors: {
            primary: '#4caf50',
            background: '#0a0a0a',
            card: '#1a1a1a',
            text: '#ffffff',
            border: '#4caf50',
            notification: '#4caf50',
            onBackground: '#ffffff',
            onCard: '#ffffff',
            onPrimary: '#000000',
            onSurface: '#ffffff',
          },
        },
      });
    }
  },
}));
