import * as BackgroundTask from 'expo-background-task';
import { getItemAsync } from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import { JecnaAPI } from 'jecnaapi-react-native';
import { entryCheckGradeNotifications } from './gradeNotifications';

export const BACKGROUND_GRADE_TASK = 'background-grade-check';

TaskManager.defineTask(BACKGROUND_GRADE_TASK, async () => {
  try {
    console.info('[BG_TASK] TASK WOKE UP - Attempting to read SecureStore...');

    const u = await getItemAsync('username');
    const p = await getItemAsync('password');

    if (!u || !p) {
      console.info('[BG_TASK] Missing credentials, aborting.');
      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    const loggedIn = await JecnaAPI.login(u, p);
    if (!loggedIn) {
      console.info('[BG_TASK] Login failed.');
      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    console.info('[BG_TASK] LOGGED IN');

    const page = await JecnaAPI.getGradesPage();

    console.info('[BG_TASK] FETCHED PAGE');

    await entryCheckGradeNotifications(page);

    console.info('[BG_TASK] DONE');

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('[BG_TASK] Background task failed:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundGradeCheck() {
  try {
    await BackgroundTask.registerTaskAsync(BACKGROUND_GRADE_TASK, {
      minimumInterval: 15,
    });
  } catch (err) {
    console.error('Failed to register background task:', err);
  }
}
