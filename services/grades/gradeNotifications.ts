import * as Notifications from 'expo-notifications';
import {
  GradesPage,
  FinalGrade,
  Name,
} from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { Change } from './changeDetectionLogic';
import { getChangesWithCache } from './gradeChecking';
import { GradeNotificationData } from '../notifications';
import { getGradeText } from '@/utils/grades/gradesFormatting';

function formatName(name: Name): string {
  // if (name.short && name.full) {
  //   return `${name.full} (${name.short})`;
  // }
  return name.full || name.short || 'Neznámý předmět';
}

function formatFinalGrade(grade?: FinalGrade): string {
  if (!grade) return 'Odstraněno';

  switch (grade.type) {
    case 'Grade':
      return grade.value.toString();
    case 'GradesWarning':
      return 'Upozornění na prospěch';
    case 'AbsenceWarning':
      return 'Upozornění na absenci';
    case 'GradesAndAbsenceWarning':
      return 'Upozornění na prospěch a absenci';
    case 'Excused':
      return 'Uvolněn(a)';
    default:
      return 'Neznámý stav';
  }
}

async function sendGradeNotifications(changes: Change[]): Promise<void> {
  for (const change of changes) {
    let title = '';
    let body = '';

    switch (change.type) {
      case 'GradeAddition': {
        const subject = formatName(change.subjectName);
        title = `Nová známka: ${subject}`;

        const desc = change.newGrade.description
          ? ` - ${change.newGrade.description}`
          : '';
        const teacher = change.newGrade.teacher?.fullName
          ? ` (${change.newGrade.teacher.fullName})`
          : '';

        body = `Byla zapsána známka ${getGradeText(change.newGrade)}${desc}${teacher}.`;
        break;
      }

      case 'GradeDeletion': {
        const subject = formatName(change.subjectName);
        title = `Smazaná známka: ${subject}`;
        body = `Známka ${getGradeText(change.oldGrade)} byla odstraněna z evidence.`;
        break;
      }

      case 'GradeValueChange': {
        const subject = formatName(change.subjectName);
        title = `Změna známky: ${subject}`;
        body = `Hodnota známky byla změněna z ${getGradeText(change.oldValue)} na ${getGradeText(change.newGrade)}.`;
        break;
      }

      case 'GradeWeightChange': {
        const subject = formatName(change.subjectName);
        title = `Změna váhy známky: ${subject}`;
        const weightText = change.nowSmall ? 'malou' : 'velkou';
        body = `Známka ${getGradeText(change.newGrade)} byla změněna na známku s ${weightText} váhou.`;
        break;
      }

      case 'FinalGradeChange': {
        const subject = formatName(change.subjectName);
        title = `Byla uzavřena známka: ${subject}`;
        const oldText = formatFinalGrade(change.oldGrade);
        const newText = formatFinalGrade(change.newGrade);

        if (!change.newGrade) {
          body = `Výsledná známka (${oldText}) byla odstraněna.`;
        } else if (!change.oldGrade) {
          body = `Byla uzavřena známka z předmětu ${subject} s hodnocením: ${newText}.`;
        } else {
          body = `Výsledná známka byla změněna z ${oldText} na ${newText}.`;
        }
        break;
      }

      case 'BehaviourFinalGradeChange': {
        title = `Změna známky z chování`;
        const oldText = formatFinalGrade(change.oldGrade);
        const newText = formatFinalGrade(change.newGrade);
        body = `Známka z chování byla změněna z ${oldText} na ${newText}.`;
        break;
      }

      case 'BehaviourNotificationAdded': {
        title = `Nové opatření k chování`;
        const notif = change.newNotification;

        const actionText =
          notif.type === 'GOOD'
            ? 'Byla udělena pochvala'
            : notif.type === 'BAD'
              ? 'Byla udělena důtka/poznámka'
              : 'Nová informace';

        body = `${actionText}: ${notif.message}`;
        break;
      }
    }

    if (title && body) {
      const data = {
        type: 'GradeNotificationData',
        data: change,
      } satisfies GradeNotificationData;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data,
        },
        trigger: null,
      });
    }
  }
}

export async function entryCheckGradeNotifications(page: GradesPage) {
  const changes = await getChangesWithCache(page);

  console.info('[BG_TASK] FOUND CHANGES: ' + changes.length);

  await sendGradeNotifications(changes);
}

export async function testNotification() {
  const not = [
    {
      type: 'GradeAddition',
      subjectName: {
        short: 'C',
        full: 'Český jazyk a literatura',
      },
      newGrade: {
        value: 3,
        small: false,
        gradeId: 12345,
      },
    },
    {
      type: 'FinalGradeChange',
      subjectName: {
        short: 'M',
        full: 'Matematika',
      },
      newGrade: {
        type: 'Grade',
        value: 1,
        subject: {
          short: 'M',
          full: 'Matematika',
        },
      },
    },
  ] satisfies Change[];

  await sendGradeNotifications(not);
}
