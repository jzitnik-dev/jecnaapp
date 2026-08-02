import { requireNativeModule } from 'expo-modules-core';

type WidgetAlarmsNativeModule = {
  schedule: (widgetName: string, triggerAtMillis: number) => void;
  cancel: (widgetName: string) => void;
};

const WidgetAlarms =
  requireNativeModule<WidgetAlarmsNativeModule>('WidgetAlarms');

export function scheduleWidgetUpdate(
  widgetName: string,
  triggerAtMillis: number
): void {
  console.log(
    `[widget-alarms] scheduleWidgetUpdate(${widgetName}, ${triggerAtMillis} ms → ${new Date(triggerAtMillis).toISOString()})`
  );
  WidgetAlarms.schedule(widgetName, triggerAtMillis);
}

export function cancelWidgetUpdate(widgetName: string): void {
  console.log(`[widget-alarms] cancelWidgetUpdate(${widgetName})`);
  WidgetAlarms.cancel(widgetName);
}
