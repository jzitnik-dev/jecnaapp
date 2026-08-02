'use no memo';

import {
  FlexWidget,
  TextWidget,
  IconWidget,
  ListWidget,
} from 'react-native-android-widget';
import {
  CacheData,
  FetcherResult,
  WidgetData,
  WidgetProps,
} from '../task-handler';
import {
  CurrentAndNextLesson,
  getCurrentAndNextLesson,
  LessonInfo,
} from '@/utils/dashboard/nextClass';
import { computeNextTimetableRefresh } from '@/utils/dashboard/computeNextTimetableRefresh';
import withLogin from '@/utils/external-fetching/withLogin';
import { getExtra } from '@/utils/external-fetching/getExtra';
import {
  getAppThemeColors,
  ThemeColorsWithColorProp,
} from '@/hooks/useAppTheme';
import Constants from 'expo-constants';
import { TimetablePage } from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { SuplResult } from '@jzitnik/jecna_supl_client_ts';

type Data = { data: CurrentAndNextLesson; theme: ThemeColorsWithColorProp };
type AditionalCache = { timetablePage: TimetablePage; supl: SuplResult | null };

async function fetcher(
  cache?: CacheData<Data, AditionalCache>
): Promise<FetcherResult<Data, AditionalCache>> {
  if (cache) {
    const currentTime = new Date();
    const cacheTime = new Date(cache.timestamp);

    // Refetch actual Timetable on different days
    const isDifferentDay =
      currentTime.toDateString() !== cacheTime.toDateString();

    if (!isDifferentDay) {
      const aditionalCache = cache.aditionalCache;
      const theme = await getAppThemeColors();

      return {
        data: {
          data: await getCurrentAndNextLesson(
            aditionalCache.timetablePage,
            aditionalCache.supl
          ),
          theme,
        },
        aditionalCache,
      };
    }
  }
  const timetablePage = await withLogin('getTimetablePage');
  const extraordinary = await getExtra();

  const theme = await getAppThemeColors();

  return {
    data: {
      data: await getCurrentAndNextLesson(timetablePage, extraordinary),
      theme,
    },
    aditionalCache: {
      timetablePage,
      supl: extraordinary,
    },
  };
}

const APP_SCHEME = Constants.expoConfig?.scheme
  ? `${Constants.expoConfig.scheme}://`
  : 'jecnaapp://';
const ACCENT_CURRENT = '#4CAF50'; // green — currently happening
const ACCENT_NEXT = '#9C27B0'; // purple — coming up next
const ACCENT_EXTRAORDINARY = '#FF9800'; // orange — schedule change
function LessonBlock({
  lesson,
  isCurrent,
  theme,
}: {
  lesson: LessonInfo;
  isCurrent: boolean;
  theme: ThemeColorsWithColorProp;
}) {
  const isExtraordinary = lesson.kind === 'extraordinary';

  const accentColor = isExtraordinary
    ? ACCENT_EXTRAORDINARY
    : isCurrent
      ? ACCENT_CURRENT
      : ACCENT_NEXT;

  const bgColor = theme.surfaceVariant;
  const textColor = theme.onSurface;
  const textVariant = theme.onSurfaceVariant;
  const iconSize = 16;

  const statusText = isExtraordinary
    ? 'Mimořádná změna!'
    : isCurrent
      ? 'Právě probíhá'
      : 'Další hodina';

  const statusIcon = isExtraordinary
    ? 'error_outline'
    : isCurrent
      ? 'play_circle_outline'
      : 'schedule';

  const countdownVal = isCurrent ? lesson.timeUntilEnd : lesson.timeUntilStart;
  const countdownLabel = isCurrent ? 'do konce' : 'do začátku';
  const title = isExtraordinary ? lesson.extraOrdinaryData : lesson.subject;

  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        alignItems: 'center',
        flexDirection: 'row',
      }}
    >
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{
          uri: `${APP_SCHEME}rozvrh`,
        }}
        style={{
          width: 'match_parent',
          backgroundColor: accentColor,
          borderRadius: 12,
          marginVertical: 4,
        }}
      >
        <FlexWidget
          style={{
            flex: 1,
            marginLeft: 4,
            padding: 16,
            flexDirection: 'column',
            width: 'match_parent',
            backgroundColor: bgColor,
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
          }}
        >
          {/* Header: Status and Countdown */}
          <FlexWidget
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              width: 'match_parent',
            }}
          >
            <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconWidget
                font="material"
                icon={statusIcon}
                size={18}
                style={{ color: accentColor, marginRight: 6 }}
              />
              <TextWidget
                text={statusText}
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: accentColor,
                }}
              />
            </FlexWidget>

            <FlexWidget style={{ alignItems: 'flex-end' }}>
              <TextWidget
                text={String(countdownVal || '')}
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: accentColor,
                }}
              />
              <TextWidget
                text={countdownLabel}
                style={{
                  fontSize: 12,
                  color: textVariant,
                  marginTop: 2,
                }}
              />
            </FlexWidget>
          </FlexWidget>

          {/* Subject & Time Info */}
          <FlexWidget
            style={{
              marginBottom: isExtraordinary ? 0 : 12,
              width: 'match_parent',
            }}
          >
            <TextWidget
              text={String(title || '')}
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: textColor,
                marginBottom: 4,
              }}
            />
            <TextWidget
              text={`${lesson.time} • ${lesson.period}. hodina`}
              style={{
                fontSize: 14,
                color: textVariant,
              }}
            />
          </FlexWidget>

          {/* Lesson Details */}
          {!isExtraordinary && (
            <FlexWidget style={{ flexDirection: 'column' }}>
              {/* TEACHER (CLICKABLE) */}
              <FlexWidget
                clickAction="OPEN_URI"
                clickActionData={{
                  uri: `${APP_SCHEME}teachers/${lesson.teacherCode}`,
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <IconWidget
                  font="material"
                  icon="person"
                  size={iconSize}
                  style={{ color: textColor, marginRight: 8 }}
                />
                <TextWidget
                  text={String(lesson.teacherFull || '')}
                  style={{ fontSize: 14, fontWeight: '500', color: textColor }}
                />
              </FlexWidget>

              {/* ROOM (CLICKABLE) */}
              <FlexWidget
                clickAction="OPEN_URI"
                clickActionData={{
                  uri: `${APP_SCHEME}ucebna/${lesson.room}`,
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: lesson.group ? 4 : 0,
                }}
              >
                <IconWidget
                  font="material"
                  icon="meeting_room"
                  size={iconSize}
                  style={{ color: textVariant, marginRight: 8 }}
                />
                <TextWidget
                  text={String(lesson.room || '')}
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: textVariant,
                  }}
                />
              </FlexWidget>

              {lesson.group && (
                <FlexWidget
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <IconWidget
                    font="material"
                    icon="group"
                    size={iconSize}
                    style={{ color: textVariant, marginRight: 8 }}
                  />
                  <TextWidget
                    text={String(lesson.group)}
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: textVariant,
                    }}
                  />
                </FlexWidget>
              )}
            </FlexWidget>
          )}
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

function CurrentTimetableWidget({ data }: WidgetProps<Data>) {
  if (data.type === 'fetching') {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: '#1a1a1a',
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text="Načítání..."
          style={{ fontSize: 16, color: '#ffffff' }}
        />
      </FlexWidget>
    );
  }

  if (data.type === 'error') {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: '#1a1a1a',
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <TextWidget
          text="Chyba při načítání"
          style={{ fontSize: 16, color: '#ffffff' }}
        />
      </FlexWidget>
    );
  }

  const { data: schedule, theme } = data.content;
  const currentLessons = schedule?.currentLessons || [];
  const nextLessons = schedule?.nextLessons || [];
  const hasLessons = currentLessons.length > 0 || nextLessons.length > 0;
  const lessons = [
    ...currentLessons.map(lesson => ({ lesson, isCurrent: true })),
    ...nextLessons.map(lesson => ({ lesson, isCurrent: false })),
  ];

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        marginVertical: 4,
        flexDirection: 'column',
      }}
    >
      {/* Title */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <IconWidget
          font="material"
          icon="schedule"
          size={24}
          style={{ color: theme.onSurface, marginRight: 8 }}
        />
        <TextWidget
          text="Rozvrh hodin"
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: theme.onSurface,
          }}
        />
      </FlexWidget>

      {/* Content */}
      {!hasLessons ? (
        <FlexWidget
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <IconWidget
            font="material"
            icon="event_available"
            size={48}
            style={{ color: theme.onSurfaceVariant, marginBottom: 12 }}
          />
          <TextWidget
            text="Žádné další hodiny dnes"
            style={{
              fontSize: 16,
              color: theme.onSurfaceVariant,
            }}
          />
        </FlexWidget>
      ) : (
        <ListWidget
          style={{
            width: 'match_parent',
          }}
        >
          {lessons.map(({ lesson, isCurrent }, index) => (
            <LessonBlock
              key={index}
              lesson={lesson}
              isCurrent={isCurrent}
              theme={theme}
            />
          ))}
        </ListWidget>
      )}
    </FlexWidget>
  );
}

export const CurrentTimetable = {
  component: CurrentTimetableWidget,
  fetcher,
  nextUpdate: (result: FetcherResult<Data, AditionalCache>, now: Date) =>
    computeNextTimetableRefresh(
      result.data.data,
      result.aditionalCache.timetablePage,
      now
    ),
} satisfies WidgetData<Data, AditionalCache>;
