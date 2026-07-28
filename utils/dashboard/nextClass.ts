import { DayOfWeek, TimetablePage } from 'jecnaapi-react-native/jecnaapi';
import { SuplResult } from '@jzitnik/jecna_supl_client_ts';
import { getCurrentDateTime } from './manualDateTime';

export type StaticLesson = {
  kind: 'normal';
  subject: string;
  teacher: string;
  teacherFull: string;
  teacherCode: string;
  room: string;
  group: string | undefined;
} & BaseLesson;

export type BaseLesson = {
  time: string;
  day: string;
  startTime: string;
  endTime: string;
  period: number;
  isCurrent: boolean;
  isNext: boolean;
  timeUntilStart?: string;
  timeUntilEnd?: string;
};

export type LessonInfo =
  | StaticLesson
  | ({
    kind: 'extraordinary';
    extraOrdinaryData: string;
  } & BaseLesson);

const DAY_MAP: Record<DayOfWeek, string> = {
  MONDAY: 'Po',
  TUESDAY: 'Út',
  WEDNESDAY: 'St',
  THURSDAY: 'Čt',
  FRIDAY: 'Pá',
  SATURDAY: 'So',
  SUNDAY: 'Ne',
};

export async function getCurrentAndNextLesson(
  page: TimetablePage,
  extraOrdinary?: SuplResult | null
): Promise<{
  currentLessons: LessonInfo[];
  nextLessons: LessonInfo[];
}> {
  const now = getCurrentDateTime();
  const currentDayNum = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  const jsDayToEnum: DayOfWeek[] = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  const currentDayEnum = jsDayToEnum[currentDayNum];
  const currentDayLabel = DAY_MAP[currentDayEnum];

  const nowDate = now.toISOString().slice(0, 10);

  const extraChanges = extraOrdinary?.schedule?.[nowDate]?.changes;

  const todaySpots = page.timetable?.timetable?.[currentDayEnum];
  const lessonPeriods = page.timetable?.lessonPeriods;

  if (!todaySpots || !lessonPeriods) {
    return { currentLessons: [], nextLessons: [] };
  }

  const currentLessons: LessonInfo[] = [];
  const nextLessons: LessonInfo[] = [];

  const formatTime = (h: number, m: number) =>
    `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  for (let i = 0; i < todaySpots.length; i++) {
    const spot = todaySpots[i];
    const period = lessonPeriods[i];
    const extraChange = extraChanges?.[i];

    if (!spot || spot.lessons.length === 0 || !period) continue;

    const startHour = period.from.hour;
    const startMinute = period.from.minute;
    const endHour = period.to.hour;
    const endMinute = period.to.minute;

    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    const startTimeStr = formatTime(startHour, startMinute);
    const endTimeStr = formatTime(endHour, endMinute);
    const periodTimeStr = `${startTimeStr} - ${endTimeStr}`;

    if (
      currentTimeMinutes >= startTimeMinutes &&
      currentTimeMinutes < endTimeMinutes
    ) {
      const timeUntilEnd = endTimeMinutes - currentTimeMinutes;
      const hoursLeft = Math.floor(timeUntilEnd / 60);
      const minutesLeft = timeUntilEnd % 60;
      const timeUntilEndStr =
        hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`;

      if (extraChange) {
        currentLessons.push({
          kind: 'extraordinary',
          extraOrdinaryData: extraChange.text,
          time: periodTimeStr,
          day: currentDayLabel,
          startTime: startTimeStr,
          endTime: endTimeStr,
          period: i + 1,
          isCurrent: true,
          isNext: false,
          timeUntilEnd: timeUntilEndStr,
        });
      } else {
        for (const lesson of spot.lessons.sort((a, b) => {
          const getFirstNum = (obj: typeof a) => {
            if (!obj.group) return Infinity;
            const [first] = obj.group.split('/').map(Number);
            return isNaN(first) ? Infinity : first;
          };
          return getFirstNum(a) - getFirstNum(b);
        })) {
          currentLessons.push({
            kind: 'normal',
            group: lesson.group ?? undefined,
            subject: lesson.subjectName.short ?? '',
            teacher: lesson.teacherName?.short ?? '',
            teacherFull: lesson.teacherName?.full ?? '',
            teacherCode: lesson.teacherName?.short ?? '',
            room: lesson.classroom ?? '',
            time: periodTimeStr,
            day: currentDayLabel,
            startTime: startTimeStr,
            endTime: endTimeStr,
            period: i + 1,
            isCurrent: true,
            isNext: false,
            timeUntilEnd: timeUntilEndStr,
          });
        }
      }
    } else if (
      currentTimeMinutes < startTimeMinutes &&
      nextLessons.length === 0
    ) {
      const timeUntilStart = startTimeMinutes - currentTimeMinutes;
      const hoursLeft = Math.floor(timeUntilStart / 60);
      const minutesLeft = timeUntilStart % 60;
      const timeUntilStartStr =
        hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`;

      if (extraChange) {
        nextLessons.push({
          kind: 'extraordinary',
          extraOrdinaryData: extraChange.text,
          time: periodTimeStr,
          day: currentDayLabel,
          startTime: startTimeStr,
          endTime: endTimeStr,
          period: i + 1,
          isCurrent: false,
          isNext: true,
          timeUntilStart: timeUntilStartStr,
        });
      } else {
        for (const lesson of spot.lessons.sort((a, b) => {
          const getFirstNum = (obj: typeof a) => {
            if (!obj.group) return Infinity;
            const [first] = obj.group.split('/').map(Number);
            return isNaN(first) ? Infinity : first;
          };
          return getFirstNum(a) - getFirstNum(b);
        })) {
          nextLessons.push({
            kind: 'normal',
            group: lesson.group ?? undefined,
            subject: lesson.subjectName.short ?? '',
            teacher: lesson.teacherName?.short ?? '',
            teacherFull: lesson.teacherName?.full ?? '',
            teacherCode: lesson.teacherName?.short ?? '',
            room: lesson.classroom ?? '',
            time: periodTimeStr,
            day: currentDayLabel,
            startTime: startTimeStr,
            endTime: endTimeStr,
            period: i + 1,
            isCurrent: false,
            isNext: true,
            timeUntilStart: timeUntilStartStr,
          });
        }
      }
    }
  }

  return { currentLessons, nextLessons };
}
