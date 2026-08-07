// iOS no-op implementation for WidgetAlarms
type WidgetAlarmsNativeModule = {
  schedule: (widgetName: string, triggerAtMillis: number) => void;
  cancel: (widgetName: string) => void;
};

export function scheduleWidgetUpdate(
  widgetName: string,
  triggerAtMillis: number
): void {
  // No-op for iOS
}

export function cancelWidgetUpdate(widgetName: string): void {
  // No-op for iOS
}
