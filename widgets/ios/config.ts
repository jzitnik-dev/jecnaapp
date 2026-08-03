import type { ExpoWidgetsConfigPluginProps } from 'expo-widgets/plugin/build/withWidgets';

export const iosWidgetConfig = {
  bundleIdentifier: 'cz.jzitnik.JecnaApp.ExpoWidgetsTarget',
  groupIdentifier: 'group.cz.jzitnik.JecnaApp',
  enablePushNotifications: false,
  widgets: [
    {
      name: 'CurrentTimetable',
      displayName: 'Aktuální hodina',
      description: 'Zobrazí aktuální a následující hodinu',
      supportedFamilies: ['systemSmall', 'systemMedium'],
      contentMarginsDisabled: false,
    },
  ],
} as const satisfies ExpoWidgetsConfigPluginProps;

export type IOSWidgetName = (typeof iosWidgetConfig.widgets)[number]['name'];
