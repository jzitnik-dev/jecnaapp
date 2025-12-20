import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { Grade, SpseJecnaClient, SubjectGrades } from '../api/SpseJecnaClient';

const BACKGROUND_FETCH_TASK = 'background-grade-fetch';
export const PREVIOUS_GRADES_KEY = 'previous_grades';
export const LAST_RAN_KEY = 'background-grade-fetch-last-ran';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface GradeNotification {
  subject: string;
  grade: string;
  weight: number;
  date?: string;
  teacher?: string;
  note: string | undefined;
}

export class GradeNotificationService {
  private client: SpseJecnaClient | null = null;
  private backgroundTaskAvailable: boolean = false;

  constructor() {
    this.setupBackgroundTask();
  }

  setClient(client: SpseJecnaClient) {
    this.client = client;
  }

  private async setupBackgroundTask() {
    if (!BackgroundTask) {
      console.warn('[GradeNotifier] Background task API is not available.');
      this.backgroundTaskAvailable = false;
      return;
    }

    try {
      await BackgroundTask.getStatusAsync();
      this.backgroundTaskAvailable = true;

      TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
        try {
          console.log('[GradeNotifier] Background task started.');
          await this.checkForNewGrades();
          console.log('[GradeNotifier] Background task finished successfully.');
          return BackgroundTask.BackgroundTaskResult.Success;
        } catch (error) {
          console.error('[GradeNotifier] Background task failed:', error);
          return BackgroundTask.BackgroundTaskResult.Failed;
        }
      });
    } catch (error) {
      console.warn(
        '[GradeNotifier] Background task could not be configured:',
        error
      );
      this.backgroundTaskAvailable = false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[GradeNotifier] Notification permissions not granted.');
      return false;
    }

    if (this.backgroundTaskAvailable && BackgroundTask) {
      const backgroundTaskStatus = await BackgroundTask.getStatusAsync();
      if (
        backgroundTaskStatus === BackgroundTask.BackgroundTaskStatus.Restricted
      ) {
        console.warn(
          '[GradeNotifier] Background task permissions are restricted or denied.'
        );
        return false;
      }
    }

    return true;
  }

  async startBackgroundFetch(): Promise<void> {
    if (!this.backgroundTaskAvailable || !BackgroundTask) {
      console.log(
        '[GradeNotifier] Background task not available, skipping registration.'
      );
      return;
    }

    try {
      await BackgroundTask.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
      });
      console.log('[GradeNotifier] Background task registered.');
    } catch (error) {
      console.error(
        '[GradeNotifier] Failed to register background task:',
        error
      );
    }
  }

  isTaskRegistered(): Promise<boolean> {
    return TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  }

  async stopBackgroundFetch(): Promise<void> {
    if (!this.backgroundTaskAvailable || !BackgroundTask) {
      console.log(
        '[GradeNotifier] Background task not available, skipping unregistration.'
      );
      return;
    }

    try {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log('[GradeNotifier] Background task unregistered.');
    } catch (error) {
      console.error(
        '[GradeNotifier] Failed to unregister background task:',
        error
      );
    }
  }

  private async getPreviousGrades(): Promise<Map<string, Grade[]>> {
    try {
      let stored = await AsyncStorage.getItem(PREVIOUS_GRADES_KEY);

      if (!stored) {
        const storedSecure =
          await SecureStore.getItemAsync(PREVIOUS_GRADES_KEY);
        if (storedSecure) {
          console.log(
            '[GradeNotifier] Migrating grades from SecureStore to AsyncStorage...'
          );
          await AsyncStorage.setItem(PREVIOUS_GRADES_KEY, storedSecure);
          await SecureStore.deleteItemAsync(PREVIOUS_GRADES_KEY);
          stored = storedSecure;
          console.log('[GradeNotifier] Migration complete.');
        }
      }

      if (stored) {
        const parsed = JSON.parse(stored);
        const map = new Map<string, Grade[]>();
        Object.entries(parsed).forEach(([subject, grades]) => {
          map.set(subject, grades as Grade[]);
        });
        return map;
      }
    } catch (error) {
      console.error('[GradeNotifier] Error loading previous grades:', error);
    }
    return new Map();
  }

  private async savePreviousGrades(
    grades: Map<string, Grade[]>
  ): Promise<void> {
    try {
      const obj: Record<string, Grade[]> = {};
      grades.forEach((gradeList, subject) => {
        obj[subject] = gradeList;
      });
      await AsyncStorage.setItem(PREVIOUS_GRADES_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('[GradeNotifier] Error saving previous grades:', error);
      // Re-throw to notify the caller that the state was not saved
      throw error;
    }
  }

  private findNewGrades(
    currentGrades: SubjectGrades[],
    previousGrades: Map<string, Grade[]>
  ): GradeNotification[] {
    const newGrades: GradeNotification[] = [];

    for (const subject of currentGrades) {
      const previousSubjectGrades = previousGrades.get(subject.subject) || [];
      const previousGradeKeys = new Set(previousSubjectGrades.map(g => g.id));

      for (const split of subject.splits) {
        for (const grade of split.grades) {
          if (!previousGradeKeys.has(grade.id)) {
            newGrades.push({
              subject: subject.subject,
              grade: grade.value.toString(),
              weight: grade.weight,
              date: grade.date,
              teacher: grade.teacher,
              note: grade.note,
            });
          }
        }
      }
    }

    return newGrades;
  }

  private gradesToMap(grades: SubjectGrades[]): Map<string, Grade[]> {
    const map = new Map<string, Grade[]>();
    for (const subject of grades) {
      const allGrades: Grade[] = [];
      for (const split of subject.splits) {
        allGrades.push(...split.grades);
      }
      map.set(subject.subject, allGrades);
    }
    return map;
  }

  private async sendGradeNotification(
    gradeNotification: GradeNotification
  ): Promise<void> {
    const title = `Nová známka z ${gradeNotification.subject}`;
    let body = `Známka: ${gradeNotification.grade} (váha: ${gradeNotification.weight})`;

    if (gradeNotification.teacher) {
      body += ` - ${gradeNotification.teacher}${
        gradeNotification.note ? '\n\n' + gradeNotification.note : ''
      }`;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { gradeNotification },
      },
      trigger: null, // Send immediately
    });
  }

  async checkForNewGrades(): Promise<void> {
    if (!this.client) {
      console.log(
        '[GradeNotifier] Client not available, skipping grade check.'
      );
      return;
    }

    try {
      const isLoggedIn = await this.client.isLoggedIn();
      if (!isLoggedIn) {
        console.log(
          '[GradeNotifier] User not logged in, skipping grade check.'
        );
        return;
      }

      // 1. Fetch current grades
      const currentGrades = await this.client.getZnamky();

      // 2. Get previous grades
      const previousGrades = await this.getPreviousGrades();

      // 3. Find new grades
      const newGrades = this.findNewGrades(currentGrades, previousGrades);

      // 4. Send notifications
      if (newGrades.length > 0) {
        console.log(`[GradeNotifier] Found ${newGrades.length} new grade(s).`);
        for (const newGrade of newGrades) {
          await this.sendGradeNotification(newGrade);
        }
      } else {
        console.log('[GradeNotifier] No new grades found.');
      }

      // 5. Save current grades as previous grades for the next run
      const currentGradesMap = this.gradesToMap(currentGrades);
      await this.savePreviousGrades(currentGradesMap);

      // 6. Mark this run as successful
      await SecureStore.setItemAsync(
        LAST_RAN_KEY,
        new Date().getTime().toString()
      );
      console.log(
        '[GradeNotifier] Successfully checked for grades and updated state.'
      );
    } catch (error) {
      console.error(
        '[GradeNotifier] An error occurred during grade check. State was not saved to prevent inconsistent data.',
        error
      );
      // Do not update LAST_RAN_KEY, so we know the last run failed.
    }
  }

  async testNotification(): Promise<void> {
    await this.sendGradeNotification({
      subject: 'Test',
      grade: '1',
      weight: 1,
      teacher: 'Test Teacher',
      note: 'Testovací známka',
    });
  }

  async getNotificationSettings(): Promise<{
    permissions: Notifications.NotificationPermissionsStatus;
    backgroundFetchStatus: BackgroundTask.BackgroundTaskStatus | null;
  }> {
    const permissions = await Notifications.getPermissionsAsync();

    let backgroundFetchStatus: BackgroundTask.BackgroundTaskStatus | null =
      null;
    if (this.backgroundTaskAvailable && BackgroundTask) {
      try {
        backgroundFetchStatus = await BackgroundTask.getStatusAsync();
      } catch (error) {
        console.warn(
          '[GradeNotifier] Failed to get background task status:',
          error
        );
      }
    }

    return {
      permissions,
      backgroundFetchStatus,
    };
  }
}

// Export singleton instance
export const gradeNotificationService = new GradeNotificationService();
