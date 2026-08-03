import type { WithAndroidWidgetsParams } from 'react-native-android-widget';

export const widgetConfig = {
  fonts: [
    './assets/fonts/SpaceMono-Regular.ttf',
    './assets/fonts/material.ttf',
  ],
  widgets: [
    {
      name: 'CurrentTimetable',
      label: 'Aktuální hodina',
      description: 'Zobrazí aktuální a následující hodinu',
      minWidth: '250dp',
      minHeight: '120dp',
      targetCellWidth: 5,
      targetCellHeight: 2,
      previewImage: './assets/widget-preview/current-timetable.png',
      updatePeriodMillis: 1_800_000,
      resizeMode: 'horizontal|vertical',
    },
    {
      name: 'Grades',
      label: 'Známky',
      description: 'Zobrazí všechny známky a průměry',
      minWidth: '250dp',
      minHeight: '180dp',
      targetCellWidth: 5,
      targetCellHeight: 3,
      updatePeriodMillis: 1_800_000,
      resizeMode: 'horizontal|vertical',
    },
    {
      name: 'Averages',
      label: 'Průměry',
      description: 'Zobrazí průměry známek všech předmětů',
      minWidth: '250dp',
      minHeight: '150dp',
      targetCellWidth: 5,
      targetCellHeight: 2,
      updatePeriodMillis: 1_800_000,
      resizeMode: 'horizontal|vertical',
    },
    {
      name: 'TodaysClasses',
      label: 'Dnešní hodiny',
      description: 'Zobrazí dnešní (nebo zítřejší) hodiny',
      minWidth: '110dp',
      minHeight: '120dp',
      targetCellWidth: 3,
      targetCellHeight: 2,
      updatePeriodMillis: 1_800_000,
      resizeMode: 'horizontal|vertical',
    },
    {
      name: 'Canteen',
      label: 'Jídelna',
      description: 'Zobrazí dnešní objednané jídlo',
      minWidth: '250dp',
      minHeight: '120dp',
      targetCellWidth: 5,
      targetCellHeight: 2,
      updatePeriodMillis: 1_800_000,
      resizeMode: 'horizontal|vertical',
    },
  ],
} as const satisfies WithAndroidWidgetsParams;

export type WidgetName = (typeof widgetConfig.widgets)[number]['name'];
