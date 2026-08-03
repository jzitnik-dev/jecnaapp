import {
  CurrentAndNextLesson,
  getCurrentAndNextLesson,
} from '@/utils/dashboard/nextClass';
import { computeNextTimetableRefresh } from '@/utils/dashboard/computeNextTimetableRefresh';
import withLogin from '@/utils/external-fetching/withLogin';
import { getExtra } from '@/utils/external-fetching/getExtra';
import {
  getAppThemeColors,
  ThemeColorsWithColorProp,
} from '@/hooks/useAppTheme';
import { TimetablePage } from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { SuplResult } from '@jzitnik/jecna_supl_client_ts';
import type { CacheData, FetcherResult } from '../task-handler';

export type WidgetContent = {
  data: CurrentAndNextLesson;
  theme: ThemeColorsWithColorProp;
};

export type AditionalCache = {
  timetablePage: TimetablePage;
  supl: SuplResult | null;
};

export async function fetcher(
  cache?: CacheData<WidgetContent, AditionalCache>
): Promise<FetcherResult<WidgetContent, AditionalCache>> {
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

export function nextUpdate(
  result: FetcherResult<WidgetContent, AditionalCache>,
  now: Date
): number | null {
  return computeNextTimetableRefresh(
    result.data.data,
    result.aditionalCache.timetablePage,
    now
  );
}
