import { entryCheckGradeNotifications } from '@/services/grades/gradeNotifications';
import * as BackgroundTask from 'expo-background-task';
import { getItemAsync } from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import { JecnaAPI } from 'jecnaapi-react-native';

export const BACKGROUND_GRADE_TASK = 'background-grade-check';

TaskManager.defineTask(BACKGROUND_GRADE_TASK, async () => {
  try {
    const u = await getItemAsync('username');
    const p = await getItemAsync('password');

    if (!u || !p) {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    const loggedIn = await JecnaAPI.login(u, p);

    if (!loggedIn) {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    const page = await JecnaAPI.getGradesPage();

    await entryCheckGradeNotifications(page);

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('Background task failed:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundGradeCheck() {
  try {
    await BackgroundTask.registerTaskAsync(BACKGROUND_GRADE_TASK, {
      minimumInterval: 60,
    });
  } catch (err) {
    console.error('Failed to register background task:', err);
  }
}
