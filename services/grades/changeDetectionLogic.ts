import {
  FinalGrade,
  Grade,
  Name,
  NotificationReference,
} from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { ExtractedData } from './gradeChecking';

export type Change =
  | GradeAddition
  | GradeDeletion
  | GradeWeightChange
  | GradeValueChange
  | FinalGradeChange
  | BehaviourFinalGradeChange
  | BehaviourNotificationAdded;

export interface GradeAddition {
  type: 'GradeAddition';
  newGrade: Grade;
  subjectName: Name;
}

export interface GradeDeletion {
  type: 'GradeDeletion';
  oldGrade: Grade;
  subjectName: Name;
}

export interface GradeWeightChange {
  type: 'GradeWeightChange';
  newGrade: Grade;
  nowSmall: boolean;
  subjectName: Name;
}

export interface GradeValueChange {
  type: 'GradeValueChange';
  newGrade: Grade;
  oldValue: number;
  subjectName: Name;
}

export interface FinalGradeChange {
  type: 'FinalGradeChange';
  subjectName: Name;
  oldGrade?: FinalGrade;
  newGrade?: FinalGrade;
}

export interface BehaviourFinalGradeChange {
  type: 'BehaviourFinalGradeChange';
  oldGrade: FinalGrade;
  newGrade: FinalGrade;
}

export interface BehaviourNotificationAdded {
  type: 'BehaviourNotificationAdded';
  newNotification: NotificationReference;
}

function areFinalGradesEqual(
  oldGrade: FinalGrade,
  newGrade: FinalGrade
): boolean {
  if (oldGrade.type !== newGrade.type) return false;

  if ('value' in oldGrade && 'value' in newGrade) {
    if (oldGrade.value !== newGrade.value) return false;
  }

  return true;
}

export function findChanges(
  oldData: ExtractedData,
  newData: ExtractedData
): Change[] {
  const changes: Change[] = [];

  // REGULAR GRADES (Additions, Deletions, Mods)
  const oldGradesTracker = new Map(oldData.grades);

  for (const [id, newFlattened] of newData.grades) {
    const oldFlattened = oldGradesTracker.get(id);

    if (!oldFlattened) {
      changes.push({
        type: 'GradeAddition',
        newGrade: newFlattened.grade,
        subjectName: newFlattened.subjectName,
      });
    } else {
      const oldGrade = oldFlattened.grade;
      const newGrade = newFlattened.grade;

      if (oldGrade.value !== newGrade.value) {
        changes.push({
          type: 'GradeValueChange',
          newGrade: newGrade,
          oldValue: oldGrade.value,
          subjectName: newFlattened.subjectName,
        });
      }

      if (oldGrade.small !== newGrade.small) {
        changes.push({
          type: 'GradeWeightChange',
          newGrade: newGrade,
          nowSmall: newGrade.small,
          subjectName: newFlattened.subjectName,
        });
      }

      oldGradesTracker.delete(id);
    }
  }

  for (const oldFlattened of oldGradesTracker.values()) {
    changes.push({
      type: 'GradeDeletion',
      oldGrade: oldFlattened.grade,
      subjectName: oldFlattened.subjectName,
    });
  }

  // SUBJECT FINAL GRADES
  const oldFinalGradesTracker = new Map(oldData.finalGrades);

  for (const [subjectKey, newFlattened] of newData.finalGrades) {
    const oldFlattened = oldFinalGradesTracker.get(subjectKey);

    if (!oldFlattened) {
      changes.push({
        type: 'FinalGradeChange',
        subjectName: newFlattened.subjectName,
        newGrade: newFlattened.grade,
      });
    } else {
      if (!areFinalGradesEqual(oldFlattened.grade, newFlattened.grade)) {
        changes.push({
          type: 'FinalGradeChange',
          subjectName: newFlattened.subjectName,
          oldGrade: oldFlattened.grade,
          newGrade: newFlattened.grade,
        });
      }
      oldFinalGradesTracker.delete(subjectKey);
    }
  }

  for (const oldFlattened of oldFinalGradesTracker.values()) {
    changes.push({
      type: 'FinalGradeChange',
      subjectName: oldFlattened.subjectName,
      oldGrade: oldFlattened.grade,
    });
  }

  // BEHAVIOUR NOTIFICATIONS
  for (const [recordId, newNotif] of newData.notifications) {
    if (!oldData.notifications.has(recordId)) {
      changes.push({
        type: 'BehaviourNotificationAdded',
        newNotification: newNotif,
      });
    }
  }

  // BEHAVIOUR FINAL GRADE
  if (
    !areFinalGradesEqual(
      oldData.behaviourFinalGrade,
      newData.behaviourFinalGrade
    )
  ) {
    changes.push({
      type: 'BehaviourFinalGradeChange',
      oldGrade: oldData.behaviourFinalGrade,
      newGrade: newData.behaviourFinalGrade,
    });
  }

  return changes;
}
