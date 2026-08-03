import {
  DayOfWeek,
  TimetablePage,
} from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { SuplResult } from '@jzitnik/jecna_supl_client_ts';
import { getCurrentDateTime } from './manualDateTime';

export type DayLesson =
  | {
      kind: 'normal';
      period: number;
      time: string;
      startTime: string;
      endTime: string;
      parts: {
        subject: string;
        room: string;
        group: string | undefined;
      }[];
    }
  | {
      kind: 'extraordinary';
      period: number;
      time: string;
      startTime: string;
      endTime: string;
      extraOrdinaryData: string;
    };

export type DaySchedule = {
  lessons: DayLesson[];
  dayFull: string;
  dateLabel: string;
  isToday: boolean;
};

export const DAY_FULL: Record<DayOfWeek, string> = {
  MONDAY: 'Pondělí',
  TUESDAY: 'Úterý',
  WEDNESDAY: 'Středa',
  THURSDAY: 'Čtvrtek',
  FRIDAY: 'Pátek',
  SATURDAY: 'Sobota',
  SUNDAY: 'Neděle',
};

const JS_DAY_TO_ENUM: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

function formatTime(h: number, m: number): string {
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function fmtLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDateLabel(d: Date): string {
  return `${d.getDate()}. ${d.getMonth() + 1}.`;
}

function lessonSort(
  a: { group?: string | null },
  b: { group?: string | null }
) {
  const getFirstNum = (obj: { group?: string | null }) => {
    if (!obj.group) return Infinity;
    const [first] = obj.group.split('/').map(Number);
    return isNaN(first) ? Infinity : first;
  };
  return getFirstNum(a) - getFirstNum(b);
}

/**
 * Returns all lessons for the given day, applying extraordinary schedule
 * changes for that date (a changed period is shown as a single extraordinary
 * lesson instead of its normal lessons).
 */
export function getDayLessons(
  page: TimetablePage,
  date: Date,
  extraOrdinary?: SuplResult | null
): DayLesson[] {
  const dayEnum = JS_DAY_TO_ENUM[date.getDay()];
  const dateKey = fmtLocalDate(date);
  const extraChanges = extraOrdinary?.schedule?.[dateKey]?.changes;
  const spots = page.timetable?.timetable?.[dayEnum];
  const lessonPeriods = page.timetable?.lessonPeriods;

  const lessons: DayLesson[] = [];
  if (!spots || !lessonPeriods) return lessons;

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];
    const period = lessonPeriods[i];
    const extraChange = extraChanges?.[i];
    if (!spot || spot.lessons.length === 0 || !period) continue;

    const startTimeStr = formatTime(period.from.hour, period.from.minute);
    const endTimeStr = formatTime(period.to.hour, period.to.minute);
    const periodTimeStr = `${startTimeStr} - ${endTimeStr}`;

    if (extraChange) {
      lessons.push({
        kind: 'extraordinary',
        period: i + 1,
        time: periodTimeStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        extraOrdinaryData: extraChange.text,
      });
    } else {
      lessons.push({
        kind: 'normal',
        period: i + 1,
        time: periodTimeStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        parts: [...spot.lessons].sort(lessonSort).map(lesson => ({
          subject: lesson.subjectName.short ?? '',
          room: lesson.classroom ?? '',
          group: lesson.group ?? undefined,
        })),
      });
    }
  }

  return lessons;
}

/**
 * Returns today's lessons, or the next school day's lessons once today's
 * classes have all finished (weekends are skipped, so a Friday evening falls
 * back to Monday).
 */
export async function getTodaysLessons(
  page: TimetablePage,
  extraOrdinary?: SuplResult | null,
  now?: Date
): Promise<DaySchedule> {
  const ref = now ?? (await getCurrentDateTime());
  const nowMinutes = ref.getHours() * 60 + ref.getMinutes();

  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(ref);
    date.setDate(date.getDate() + offset);
    const lessons = getDayLessons(page, date, extraOrdinary);
    if (lessons.length === 0) continue;

    if (offset === 0) {
      const hasRemaining = lessons.some(l => {
        const [eh, em] = l.endTime.split(':').map(Number);
        return eh * 60 + em > nowMinutes;
      });
      if (!hasRemaining) continue;
    }

    return {
      lessons,
      dayFull: DAY_FULL[JS_DAY_TO_ENUM[date.getDay()]],
      dateLabel: fmtDateLabel(date),
      isToday: offset === 0,
    };
  }

  const today = new Date(ref);
  return {
    lessons: getDayLessons(page, today, extraOrdinary),
    dayFull: DAY_FULL[JS_DAY_TO_ENUM[today.getDay()]],
    dateLabel: fmtDateLabel(today),
    isToday: true,
  };
}
