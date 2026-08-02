import '@/services/grades/backgroundTask';
import { widgetTaskHandler } from './widgets/android/task-handler';

import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
registerWidgetTaskHandler(widgetTaskHandler);
