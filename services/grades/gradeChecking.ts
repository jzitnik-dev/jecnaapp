import {
  Grade,
  GradesPage,
  SchoolYearHalf,
  FinalGrade,
  NotificationReference,
  Name,
} from 'jecnaapi-react-native/jecnaapi';
import * as Crypto from 'expo-crypto';
import { findChanges, Change } from './changeDetectionLogic';
import { loadCache, saveCache, updateTimestamp } from './gradeCache';

export async function generateHash(str: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    str
  );
}

export interface FlattenedGrade {
  grade: Grade;
  subjectName: Name;
}

export interface FlattenedFinalGrade {
  grade: FinalGrade;
  subjectName: Name;
}

export interface ExtractedData {
  grades: Map<number, FlattenedGrade>;
  finalGrades: Map<string, FlattenedFinalGrade>;
  notifications: Map<number, NotificationReference>;
  behaviourFinalGrade: FinalGrade;
}

function extractData(page: GradesPage): ExtractedData {
  const grades = new Map<number, FlattenedGrade>();
  const finalGrades = new Map<string, FlattenedFinalGrade>();
  const notifications = new Map<number, NotificationReference>();

  // Attach the subject name as we flatten the structure
  for (const [subjectKey, subject] of Object.entries(page.subjectsMap)) {
    if (subject.finalGrade) {
      finalGrades.set(subjectKey, {
        grade: subject.finalGrade,
        subjectName: subject.name,
      });
    }

    for (const partGrades of Object.values(subject.grades.subjectPartsGrades)) {
      for (const grade of partGrades) {
        grades.set(grade.gradeId, {
          grade,
          subjectName: subject.name,
        });
      }
    }
  }

  for (const notif of page.behaviour.notifications) {
    notifications.set(notif.recordId, notif);
  }

  return {
    grades,
    finalGrades,
    notifications,
    behaviourFinalGrade: page.behaviour.finalGrade,
  };
}

export interface CachedGradeData {
  data: ExtractedData;
  firstCalendarYear: number;
  schoolYearHalf: SchoolYearHalf;
  hash: string;
}

export interface GradeChangeResult {
  changes: Change[];
  newCache?: CachedGradeData;
}

async function getChanges(
  page: GradesPage,
  cached?: CachedGradeData
): Promise<GradeChangeResult> {
  const stringToHash = JSON.stringify({
    subjects: page.subjectsMap,
    behaviour: page.behaviour,
  });

  if (
    !cached ||
    cached.firstCalendarYear !== page.selectedSchoolYear.firstCalendarYear ||
    cached.schoolYearHalf !== page.selectedSchoolYearHalf
  ) {
    const newHash = await generateHash(stringToHash);
    const newData = extractData(page);

    return {
      changes: [],
      newCache: {
        data: newData,
        firstCalendarYear: page.selectedSchoolYear.firstCalendarYear,
        schoolYearHalf: page.selectedSchoolYearHalf,
        hash: newHash,
      },
    };
  }

  const newHash = await generateHash(stringToHash);

  if (cached.hash === newHash) {
    return { changes: [] };
  }

  const newData = extractData(page);
  const changes = findChanges(cached.data, newData);

  return {
    changes,
    newCache: {
      data: newData,
      firstCalendarYear: page.selectedSchoolYear.firstCalendarYear,
      schoolYearHalf: page.selectedSchoolYearHalf,
      hash: newHash,
    },
  };
}

export async function getChangesWithCache(
  newData: GradesPage
): Promise<Change[]> {
  const cache = await loadCache();
  const res = await getChanges(newData, cache);

  if (res.newCache) {
    await saveCache(res.newCache);
  } else {
    await updateTimestamp();
  }

  return res.changes;
}
