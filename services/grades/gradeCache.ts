import AsyncStorage from '@react-native-async-storage/async-storage';
import { CachedGradeData } from './gradeChecking';

export const KEY = 'grades_cache';

export async function clearCache() {
  await AsyncStorage.removeItem(KEY);
}

export async function getLastSaved(): Promise<Date | undefined> {
  const jsonString = await AsyncStorage.getItem(KEY);

  if (!jsonString) return undefined;

  const parsed = JSON.parse(jsonString);

  return new Date(parsed.timestamp);
}

export async function updateTimestamp() {
  const jsonString = await AsyncStorage.getItem(KEY);

  if (!jsonString) return;

  const parsed = JSON.parse(jsonString);

  parsed.timestamp = new Date().getTime();

  const string = JSON.stringify(parsed);

  await AsyncStorage.setItem(KEY, string);
}

export async function saveCache(cache: CachedGradeData) {
  const storableCache = {
    ...cache,
    data: {
      grades: Array.from(cache.data.grades.entries()),
      finalGrades: Array.from(cache.data.finalGrades.entries()),
      notifications: Array.from(cache.data.notifications.entries()),
      behaviourFinalGrade: cache.data.behaviourFinalGrade,
    },
    timestamp: new Date().getTime(),
  };

  const jsonString = JSON.stringify(storableCache);
  await AsyncStorage.setItem(KEY, jsonString);
}

export async function loadCache(): Promise<CachedGradeData | undefined> {
  const jsonString = await AsyncStorage.getItem(KEY);

  if (!jsonString) return undefined;

  const parsed = JSON.parse(jsonString);

  return {
    ...parsed,
    data: {
      grades: new Map(parsed.data.grades),
      finalGrades: new Map(parsed.data.finalGrades),
      notifications: new Map(parsed.data.notifications),
      behaviourFinalGrade: parsed.data.behaviourFinalGrade,
    },
  } as CachedGradeData;
}
