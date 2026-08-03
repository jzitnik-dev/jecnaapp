import withLogin from '@/utils/external-fetching/withLogin';
import { getExtra } from '@/utils/external-fetching/getExtra';
import {
  getAppThemeColors,
  ThemeColorsWithColorProp,
} from '@/hooks/useAppTheme';
import { TimetablePage } from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { SuplResult } from '@jzitnik/jecna_supl_client_ts';
import { DaySchedule, getTodaysLessons } from '@/utils/dashboard/dayLessons';
import type { CacheData, FetcherResult } from '../task-handler';

export type WidgetContent = DaySchedule & {
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
    const isDifferentDay =
      currentTime.toDateString() !== cacheTime.toDateString();

    if (!isDifferentDay) {
      const ac = cache.aditionalCache;
      const theme = await getAppThemeColors();

      return {
        data: { ...(await getTodaysLessons(ac.timetablePage, ac.supl)), theme },
        aditionalCache: ac,
      };
    }
  }
  const timetablePage = await withLogin('getTimetablePage');
  const supl = await getExtra();
  const theme = await getAppThemeColors();

  return {
    data: { ...(await getTodaysLessons(timetablePage, supl)), theme },
    aditionalCache: { timetablePage, supl },
  };
}
