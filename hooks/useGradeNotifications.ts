import * as BackgroundFetch from 'expo-background-fetch';
import { useCallback, useEffect, useState } from 'react';
import { gradeNotificationService } from '../services/GradeNotificationService';
import { useSpseJecnaClient } from './useSpseJecnaClient';

export interface NotificationSettings {
  permissions: {
    status: 'granted' | 'denied' | 'undetermined';
    canAskAgain: boolean;
  };
  backgroundFetchStatus: 'available' | 'denied' | 'restricted' | null;
}

export function useGradeNotifications() {
  const { client } = useSpseJecnaClient();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (client) {
      gradeNotificationService.setClient(client);
    }
  }, [client]);

  const loadSettings = useCallback(async () => {
    try {
      const notificationSettings = await gradeNotificationService.getNotificationSettings();
      setSettings({
        permissions: {
          status: notificationSettings.permissions.status,
          canAskAgain: notificationSettings.permissions.canAskAgain,
        },
        backgroundFetchStatus: notificationSettings.backgroundFetchStatus === BackgroundFetch.BackgroundFetchStatus.Available ? 'available' :
                               notificationSettings.backgroundFetchStatus === BackgroundFetch.BackgroundFetchStatus.Denied ? 'denied' :
                               notificationSettings.backgroundFetchStatus === BackgroundFetch.BackgroundFetchStatus.Restricted ? 'restricted' : null,
      });
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const granted = await gradeNotificationService.requestPermissions();
      setIsEnabled(granted);
      await loadSettings();
      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadSettings]);

  const startNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      await gradeNotificationService.startBackgroundFetch();
      setIsEnabled(true);
      await loadSettings();
    } catch (error) {
      console.error('Error starting notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadSettings]);

  const stopNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      await gradeNotificationService.stopBackgroundFetch();
      setIsEnabled(false);
      await loadSettings();
    } catch (error) {
      console.error('Error stopping notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadSettings]);

  const testNotification = useCallback(async () => {
    try {
      await gradeNotificationService.testNotification();
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }, []);

  const checkForNewGrades = useCallback(async () => {
    try {
      await gradeNotificationService.checkForNewGrades();
    } catch (error) {
      console.error('Error checking for new grades:', error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isEnabled,
    isLoading,
    requestPermissions,
    startNotifications,
    stopNotifications,
    testNotification,
    checkForNewGrades,
    loadSettings,
  };
}
