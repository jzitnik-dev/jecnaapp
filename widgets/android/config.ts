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
      description: 'This is my first widget',
      minWidth: '250dp',
      minHeight: '120dp',
      targetCellWidth: 5,
      targetCellHeight: 2,
      previewImage: './assets/widget-preview/current-timetable.png',
      updatePeriodMillis: 60_000,
      resizeMode: 'horizontal|vertical',
    },
  ],
} as const satisfies WithAndroidWidgetsParams;

export type WidgetName = (typeof widgetConfig.widgets)[number]['name'];
