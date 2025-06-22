import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef } from 'react';
import { useSpseJecnaClient } from '../hooks/useSpseJecnaClient';
import { gradeNotificationService } from '../services/GradeNotificationService';

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { client } = useSpseJecnaClient();
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    try {
      if (client) {
        gradeNotificationService.setClient(client);
      }
    } catch (error) {
      console.error('Error setting client in notification service:', error);
    }
  }, [client]);

  useEffect(() => {
    try {
      // Set up notification listeners
      notificationListener.current =
        Notifications.addNotificationReceivedListener(notification => {
          console.log('Notification received:', notification);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener(response => {
          console.log('Notification response:', response);

          // Handle notification tap - could navigate to grades screen
          const data = response.notification.request.content.data;
          if (data?.gradeNotification) {
            // Could navigate to grades screen here
            console.log('Grade notification tapped:', data.gradeNotification);
          }
        });
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
    }

    return () => {
      try {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch (error) {
        console.error('Error cleaning up notification listeners:', error);
      }
    };
  }, []);

  return <>{children}</>;
}
