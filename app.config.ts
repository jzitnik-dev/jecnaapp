import { ExpoConfig, ConfigContext } from 'expo/config';
import packageJson from './package.json';
import { widgetConfig } from './widgets/android/config.ts';
import { iosWidgetConfig } from './widgets/ios/config.ts';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Ječná App',
  slug: 'JecnaMobile',

  version: packageJson.version,

  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'jecnaapp',
  userInterfaceStyle: 'automatic',

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'cz.jzitnik.JecnaApp',
    infoPlist: {
      UIBackgroundModes: ['processing', 'fetch'],
      BGTaskSchedulerPermittedIdentifiers: [
        'com.expo.modules.backgroundtask.processing',
        'my-local-notification-task',
      ],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    permissions: ['RECEIVE_BOOT_COMPLETED', 'WAKE_LOCK', 'VIBRATE', 'INTERNET'],
    package: 'cz.jzitnik.JecnaApp',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#ffffff',
      },
    ],
    'expo-task-manager',
    'expo-background-task',
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 26,
        },
      },
    ],
    'expo-sharing',
    ['react-native-android-widget', widgetConfig],
    ['expo-widgets', iosWidgetConfig],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: 'fa28708e-72c2-4d2e-9a95-29f9084e995e',
    },
  },
});
