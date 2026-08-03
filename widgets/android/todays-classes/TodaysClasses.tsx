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
import { getAppThemeColors } from '@/hooks/useAppTheme';
import type { ThemeColorsWithColorProp } from '@/hooks/useAppTheme';
import withLogin from '@/utils/external-fetching/withLogin';
import { getExtra } from '@/utils/external-fetching/getExtra';
import Constants from 'expo-constants';
import { TimetablePage } from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { SuplResult } from '@jzitnik/jecna_supl_client_ts';
import {
  DayLesson,
  DaySchedule,
  getTodaysLessons,
} from '@/utils/dashboard/dayLessons';

type Data = DaySchedule & { theme: ThemeColorsWithColorProp };
type AditionalCache = { timetablePage: TimetablePage; supl: SuplResult | null };

async function fetcher(
  cache?: CacheData<Data, AditionalCache>
): Promise<FetcherResult<Data, AditionalCache>> {
  if (cache) {
    const currentTime = new Date();
    const cacheTime = new Date(cache.timestamp);
    const isDifferentDay =
      currentTime.toDateString() !== cacheTime.toDateString();

    if (!isDifferentDay) {
      const ac = cache.aditionalCache;
      const theme = await getAppThemeColors();

      return {
        data: { ...getTodaysLessons(ac.timetablePage, ac.supl), theme },
        aditionalCache: ac,
      };
    }
  }
  const timetablePage = await withLogin('getTimetablePage');
  const supl = await getExtra();
  const theme = await getAppThemeColors();

  return {
    data: { ...getTodaysLessons(timetablePage, supl), theme },
    aditionalCache: { timetablePage, supl },
  };
}

const APP_SCHEME = Constants.expoConfig?.scheme
  ? `${Constants.expoConfig.scheme}://`
  : 'jecnaapp://';
const ACCENT_EXTRAORDINARY = '#FF9800'; // orange — schedule change

function LessonRow({
  lesson,
  theme,
}: {
  lesson: DayLesson;
  theme: ThemeColorsWithColorProp;
}) {
  const isExtraordinary = lesson.kind === 'extraordinary';
  const parts = isExtraordinary ? [] : lesson.parts;

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
        clickActionData={{ uri: `${APP_SCHEME}drawer/rozvrh` }}
        style={{
          width: 'match_parent',
          backgroundColor: theme.surfaceVariant,
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 6,
          marginVertical: 2,
        }}
      >
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: 'match_parent',
          }}
        >
          <FlexWidget
            style={{ width: 38, flexDirection: 'column', marginRight: 6 }}
          >
            <TextWidget
              text={String(lesson.period)}
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: isExtraordinary ? ACCENT_EXTRAORDINARY : theme.onSurface,
              }}
            />
            <TextWidget
              text={lesson.startTime}
              style={{ fontSize: 10, color: theme.onSurfaceVariant }}
            />
          </FlexWidget>

          {isExtraordinary ? (
            <FlexWidget
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                overflow: 'hidden',
              }}
            >
              <IconWidget
                font="material"
                icon="error_outline"
                size={15}
                style={{ color: ACCENT_EXTRAORDINARY, marginRight: 4 }}
              />
              <FlexWidget style={{ flex: 1, overflow: 'hidden' }}>
                <TextWidget
                  text={lesson.extraOrdinaryData}
                  maxLines={2}
                  truncate="END"
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: ACCENT_EXTRAORDINARY,
                  }}
                />
              </FlexWidget>
            </FlexWidget>
          ) : (
            <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
              {parts.map((part, i) => (
                <FlexWidget
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: 'match_parent',
                    marginBottom: i < parts.length - 1 ? 2 : 0,
                  }}
                >
                  <FlexWidget style={{ flex: 1, overflow: 'hidden' }}>
                    <TextWidget
                      text={
                        part.group
                          ? `${part.subject} ${part.group}`
                          : part.subject
                      }
                      maxLines={1}
                      truncate="END"
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: theme.onSurface,
                      }}
                    />
                  </FlexWidget>
                  {part.room ? (
                    <TextWidget
                      text={part.room}
                      maxLines={1}
                      truncate="END"
                      style={{
                        fontSize: 11,
                        color: theme.onSurfaceVariant,
                        marginLeft: 6,
                      }}
                    />
                  ) : null}
                </FlexWidget>
              ))}
            </FlexWidget>
          )}
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

function TodaysClassesWidget({ data }: WidgetProps<Data>) {
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

  const { lessons, dayFull, dateLabel, isToday, theme } = data.content;
  const title = isToday ? `Dnes · ${dateLabel}` : `${dayFull} · ${dateLabel}`;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
      }}
    >
      <FlexWidget
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
      >
        <IconWidget
          font="material"
          icon="calendar_today"
          size={18}
          style={{ color: theme.onSurface, marginRight: 6 }}
        />
        <TextWidget
          text={title}
          style={{ fontSize: 16, fontWeight: '700', color: theme.onSurface }}
        />
      </FlexWidget>

      {lessons.length === 0 ? (
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
            size={40}
            style={{ color: theme.onSurfaceVariant, marginBottom: 8 }}
          />
          <TextWidget
            text="Žádné hodiny"
            style={{ fontSize: 15, color: theme.onSurfaceVariant }}
          />
        </FlexWidget>
      ) : (
        <ListWidget style={{ width: 'match_parent', height: 'match_parent' }}>
          {lessons.map((lesson, index) => (
            <LessonRow key={index} lesson={lesson} theme={theme} />
          ))}
        </ListWidget>
      )}
    </FlexWidget>
  );
}

export const TodaysClasses = {
  component: TodaysClassesWidget,
  fetcher,
} satisfies WidgetData<Data, AditionalCache>;
