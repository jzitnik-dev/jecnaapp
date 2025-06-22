import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import { Grade, SpseJecnaClient, SubjectGrades } from '../api/SpseJecnaClient';

const BACKGROUND_FETCH_TASK = 'background-grade-fetch';
const PREVIOUS_GRADES_KEY = 'previous_grades';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
}

export class GradeNotificationService {
  private client: SpseJecnaClient | null = null;

  constructor() {
    this.setupBackgroundTask();
  }

  setClient(client: SpseJecnaClient) {
    this.client = client;
  }

  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    // Request background fetch permissions
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 60, // 1 hour in seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });

    return true;
  }

  private setupBackgroundTask() {
    TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
      try {
        console.log('Background task: Checking for new grades...');
        await this.checkForNewGrades();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Background task error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  }

  async startBackgroundFetch(): Promise<void> {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 60 * 60, // 1 hour in seconds
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background fetch registered');
    } catch (error) {
      console.error('Failed to register background fetch:', error);
    }
  }

  async stopBackgroundFetch(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log('Background fetch unregistered');
    } catch (error) {
      console.error('Failed to unregister background fetch:', error);
    }
  }

  private async getPreviousGrades(): Promise<Map<string, Grade[]>> {
    try {
      const stored = await SecureStore.getItemAsync(PREVIOUS_GRADES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const map = new Map<string, Grade[]>();
        Object.entries(parsed).forEach(([subject, grades]) => {
          map.set(subject, grades as Grade[]);
        });
        return map;
      }
    } catch (error) {
      console.error('Error loading previous grades:', error);
    }
    return new Map();
  }

  private async savePreviousGrades(grades: Map<string, Grade[]>): Promise<void> {
    try {
      const obj: Record<string, Grade[]> = {};
      grades.forEach((gradeList, subject) => {
        obj[subject] = gradeList;
      });
      await SecureStore.setItemAsync(PREVIOUS_GRADES_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Error saving previous grades:', error);
    }
  }

  private createGradeKey(grade: Grade): string {
    return `${grade.value}-${grade.weight}-${grade.date || ''}-${grade.teacher || ''}`;
  }

  private findNewGrades(currentGrades: SubjectGrades[], previousGrades: Map<string, Grade[]>): GradeNotification[] {
    const newGrades: GradeNotification[] = [];

    for (const subject of currentGrades) {
      const previousSubjectGrades = previousGrades.get(subject.subject) || [];
      const previousGradeKeys = new Set(previousSubjectGrades.map(g => this.createGradeKey(g)));

      for (const split of subject.splits) {
        for (const grade of split.grades) {
          const gradeKey = this.createGradeKey(grade);
          if (!previousGradeKeys.has(gradeKey)) {
            newGrades.push({
              subject: subject.subject,
              grade: grade.value.toString(),
              weight: grade.weight,
              date: grade.date,
              teacher: grade.teacher,
            });
          }
        }
      }
    }

    return newGrades;
  }

  private async sendGradeNotification(gradeNotification: GradeNotification): Promise<void> {
    const title = `Nová známka z ${gradeNotification.subject}`;
    let body = `Známka: ${gradeNotification.grade} (váha: ${gradeNotification.weight})`;
    
    if (gradeNotification.teacher) {
      body += ` - ${gradeNotification.teacher}`;
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
      console.log('No client available for grade checking');
      return;
    }

    try {
      // Check if user is logged in
      const isLoggedIn = await this.client.isLoggedIn();
      if (!isLoggedIn) {
        console.log('User not logged in, skipping grade check');
        return;
      }

      // Get current grades
      const currentGrades = await this.client.getZnamky();
      
      // Get previous grades
      const previousGrades = await this.getPreviousGrades();
      
      // Find new grades
      const newGrades = this.findNewGrades(currentGrades, previousGrades);
      
      // Send notifications for new grades
      for (const newGrade of newGrades) {
        await this.sendGradeNotification(newGrade);
      }

      // Save current grades as previous grades
      const currentGradesMap = new Map<string, Grade[]>();
      for (const subject of currentGrades) {
        const allGrades: Grade[] = [];
        for (const split of subject.splits) {
          allGrades.push(...split.grades);
        }
        currentGradesMap.set(subject.subject, allGrades);
      }
      await this.savePreviousGrades(currentGradesMap);

      console.log(`Found ${newGrades.length} new grades`);
    } catch (error) {
      console.error('Error checking for new grades:', error);
    }
  }

  async testNotification(): Promise<void> {
    await this.sendGradeNotification({
      subject: 'Test',
      grade: '1',
      weight: 1,
      teacher: 'Test Teacher',
    });
  }

  async getNotificationSettings(): Promise<{
    permissions: Notifications.NotificationPermissionsStatus;
    backgroundFetchStatus: BackgroundFetch.BackgroundFetchStatus | null;
  }> {
    const permissions = await Notifications.getPermissionsAsync();
    const backgroundFetchStatus = await BackgroundFetch.getStatusAsync();
    
    return {
      permissions,
      backgroundFetchStatus,
    };
  }
}

// Export singleton instance
export const gradeNotificationService = new GradeNotificationService();