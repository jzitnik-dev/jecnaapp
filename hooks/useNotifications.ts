import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useLocalNotifications() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [canAskAgain, setCanAskAgain] = useState<boolean>(true);

  const checkPermissions = useCallback(async (): Promise<boolean> => {
    const settings = await Notifications.getPermissionsAsync();
    const granted = settings.status === 'granted';

    setHasPermission(granted);
    setCanAskAgain(settings.canAskAgain);

    return granted;
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const settings = await Notifications.getPermissionsAsync();

    if (settings.status === 'granted') {
      setHasPermission(true);
      return true;
    }

    if (!settings.canAskAgain) {
      await Linking.openSettings();
      return false;
    }

    const newSettings = await Notifications.requestPermissionsAsync();
    const granted = newSettings.status === 'granted';

    setHasPermission(granted);
    setCanAskAgain(newSettings.canAskAgain);

    return granted;
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkPermissions();

    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          checkPermissions();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [checkPermissions]);

  return { hasPermission, canAskAgain, requestPermissions, checkPermissions };
}

export function useNotificationSettings() {
  const { hasPermission, canAskAgain, requestPermissions } =
    useLocalNotifications();
  const [showSuccess, setShowSuccess] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPermissionRef = useRef(hasPermission);

  useEffect(() => {
    const justGranted =
      prevPermissionRef.current === false && hasPermission === true;

    if (justGranted) {
      setShowSuccess(true);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }

    prevPermissionRef.current = hasPermission;
  }, [hasPermission]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    hasPermission,
    canAskAgain,
    showSuccess,
    handleRequestPermissions: requestPermissions,
  };
}
