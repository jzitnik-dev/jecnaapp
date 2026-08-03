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
    {
      name: 'Grades',
      displayName: 'Známky',
      description: 'Zobrazí všechny známky a průměry',
      supportedFamilies: ['systemSmall', 'systemMedium', 'systemLarge'],
      contentMarginsDisabled: false,
    },
    {
      name: 'Averages',
      displayName: 'Průměry',
      description: 'Zobrazí průměry známek všech předmětů',
      supportedFamilies: ['systemSmall', 'systemMedium', 'systemLarge'],
      contentMarginsDisabled: false,
    },
    {
      name: 'TodaysClasses',
      displayName: 'Dnešní hodiny',
      description: 'Zobrazí dnešní (nebo zítřejší) hodiny',
      supportedFamilies: ['systemSmall', 'systemMedium', 'systemLarge'],
      contentMarginsDisabled: false,
    },
    {
      name: 'Canteen',
      displayName: 'Jídelna',
      description: 'Zobrazí dnešní objednané jídlo',
      supportedFamilies: ['systemSmall', 'systemMedium'],
      contentMarginsDisabled: false,
    },
  ],
} as const satisfies ExpoWidgetsConfigPluginProps;

export type IOSWidgetName = (typeof iosWidgetConfig.widgets)[number]['name'];
