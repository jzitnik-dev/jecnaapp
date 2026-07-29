import { Platform, Linking } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

export function useBatterySettings() {
  const openBatterySettings = async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
      );
    } catch (error) {
      console.warn(
        'Failed to open battery settings, falling back to App Settings',
        error
      );
      await Linking.openSettings();
    }
  };

  return { openBatterySettings };
}
