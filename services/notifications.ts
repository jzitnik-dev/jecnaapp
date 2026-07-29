import { Change } from './grades/changeDetectionLogic';

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

type Router = ReturnType<typeof useRouter>;

let pendingNotification: NotificationData | null = null;
let routerGlobal: Router | null = null;

export interface GradeNotificationData {
  type: 'GradeNotificationData';
  data: Change;
}

export type NotificationData = GradeNotificationData;

export function useNotificationListener() {
  const router = useRouter();

  useEffect(() => {
    routerGlobal = router;

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      pendingNotification = lastResponse.notification.request.content
        .data as any as NotificationData;
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      response => {
        pendingNotification = response.notification.request.content
          .data as any as NotificationData;
        consumeNotifications();
      }
    );
    return () => subscription.remove();
  }, [router]);
}

export function consumeNotifications(): boolean {
  const data = pendingNotification;
  pendingNotification = null;

  if (!data || !routerGlobal) {
    return false;
  }

  switch (data.type) {
    case 'GradeNotificationData':
      handleGradeNotification(routerGlobal, data);
      break;
  }

  return true;
}

// -----

function handleGradeNotification(router: Router, data: GradeNotificationData) {
  router.replace({
    pathname: '/drawer/znamky',
    params: {
      handleGradeChange: JSON.stringify(data.data),
    },
  });
}
