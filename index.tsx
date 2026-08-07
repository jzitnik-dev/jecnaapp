import '@/services/grades/backgroundTask';
import { widgetTaskHandler } from './widgets/android/task-handler';

import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { registerIOSWidgetUpdates } = require('./widgets/ios/task-handler');
  registerIOSWidgetUpdates();
}

export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
registerWidgetTaskHandler(widgetTaskHandler);
