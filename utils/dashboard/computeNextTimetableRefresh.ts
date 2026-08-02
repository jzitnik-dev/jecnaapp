import {
  DayOfWeek,
  TimetablePage,
} from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { CurrentAndNextLesson } from './nextClass';

const DURING_CLASS_INTERVAL_MS = 5 * 60_000;
const BETWEEN_CLASSES_INTERVAL_MS = 2 * 60_000;
const PRE_FETCH_LEAD_MS = 60_000;

const JS_DAY_TO_ENUM: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

function fmtMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function fmtDate(ms: number): string {
  const d = new Date(ms);
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const offset = `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  return `${d.toLocaleString('cs-CZ', { hour12: false })} ${offset}`;
}

function logResult(reason: string, at: number | null) {
  if (at == null) {
    console.log(
      `[widget-alarms] next refresh: ${reason} → nothing to schedule (relying on 30-min periodic fallback)`
    );
  } else {
    console.log(
      `[widget-alarms] next refresh: ${reason} → ${fmtDate(at)} (epoch ${at})`
    );
  }
}

/**
 * Computes the timestamp of the next exact alarm for the timetable widget,
 * based on the real clock passed in `now`.
 *
 * - During a lesson: refresh again in 5 minutes.
 * - Between lessons: refresh again in 2 minutes.
 * - Otherwise (end of day): pre-fetch the first lesson of the next school day.
 *
 * Returns `null` when there is nothing to schedule (the periodic fallback
 * keeps the widget fresh in that case).
 */
export function computeNextTimetableRefresh(
  schedule: CurrentAndNextLesson,
  timetablePage: TimetablePage,
  now: Date
): number | null {
  if (schedule.currentLessons.length > 0) {
    const at = now.getTime() + DURING_CLASS_INTERVAL_MS;
    logResult(
      `lesson in progress (${schedule.currentLessons.length} current) → refresh in ${DURING_CLASS_INTERVAL_MS / 60_000} min`,
      at
    );
    return at;
  }

  if (schedule.nextLessons.length > 0) {
    const at = now.getTime() + BETWEEN_CLASSES_INTERVAL_MS;
    logResult(
      `between classes (${schedule.nextLessons.length} next) → refresh in ${BETWEEN_CLASSES_INTERVAL_MS / 60_000} min`,
      at
    );
    return at;
  }

  const timetable = timetablePage.timetable;
  const lessonPeriods = timetable?.lessonPeriods;
  if (!timetable?.timetable || !lessonPeriods || lessonPeriods.length === 0) {
    logResult('no timetable data available', null);
    return null;
  }

  for (let offset = 1; offset <= 7; offset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    date.setHours(0, 0, 0, 0);

    const spots = timetable.timetable[JS_DAY_TO_ENUM[date.getDay()]];
    if (!spots) continue;

    const firstLessonIndex = spots.findIndex(
      (spot, index) => spot.lessons.length > 0 && lessonPeriods[index]
    );
    if (firstLessonIndex === -1) continue;

    const period = lessonPeriods[firstLessonIndex];
    const startMinutes = period.from.hour * 60 + period.from.minute;
    date.setMinutes(startMinutes);
    const at = date.getTime() - PRE_FETCH_LEAD_MS;
    logResult(
      `no lessons today → pre-fetching first lesson in ${offset} day(s) at ${fmtMinutes(startMinutes)} (minus ${PRE_FETCH_LEAD_MS / 1000}s lead)`,
      at
    );
    return at;
  }

  logResult('no lessons found in the next 7 days', null);
  return null;
}
