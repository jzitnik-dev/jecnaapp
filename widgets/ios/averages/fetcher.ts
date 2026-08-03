import withLogin from '@/utils/external-fetching/withLogin';
import {
  getAppThemeColors,
  ThemeColorsWithColorProp,
} from '@/hooks/useAppTheme';
import { GradesPage } from '@jzitnik/jecnaapi-react-native/jecnaapi';
import type { CacheData, FetcherResult } from '../task-handler';

export type WidgetContent = {
  grades: GradesPage;
  theme: ThemeColorsWithColorProp;
};

export type AditionalCache = Record<string, never>;

export async function fetcher(
  _cache?: CacheData<WidgetContent, AditionalCache>
): Promise<FetcherResult<WidgetContent, AditionalCache>> {
  console.log('[widget] Averages (iOS): fetching grades page from network');
  const grades = await withLogin('getGradesPage');
  const theme = await getAppThemeColors();
  return { data: { grades, theme }, aditionalCache: {} };
}
