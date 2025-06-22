import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef } from 'react';
import { useSpseJecnaClient } from '../hooks/useSpseJecnaClient';
import { gradeNotificationService } from '../services/GradeNotificationService';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { client } = useSpseJecnaClient();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (client) {
      gradeNotificationService.setClient(client);
    }
  }, [client]);

  useEffect(() => {
    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      // Handle notification tap - could navigate to grades screen
      const data = response.notification.request.content.data;
      if (data?.gradeNotification) {
        // Could navigate to grades screen here
        console.log('Grade notification tapped:', data.gradeNotification);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return <>{children}</>;
}