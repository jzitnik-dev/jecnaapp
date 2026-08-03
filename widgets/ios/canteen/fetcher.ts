import { Canteen as CanteenAPI } from '@jzitnik/jecnaapi-react-native';
import { MenuPage } from '@jzitnik/jecnaapi-react-native/canteen';
import { getItemAsync } from 'expo-secure-store';
import {
  getAppThemeColors,
  ThemeColorsWithColorProp,
} from '@/hooks/useAppTheme';
import type { CacheData, FetcherResult } from '../task-handler';

export type WidgetContent = {
  page: MenuPage;
  theme: ThemeColorsWithColorProp;
};

export type AditionalCache = Record<string, never>;

async function ensureCanteenLogin(): Promise<void> {
  if (await CanteenAPI.isLoggedIn()) {
    return;
  }
  const u = await getItemAsync('username');
  const p = await getItemAsync('password');
  if (!u || !p) {
    throw new Error('Not logged in');
  }
  await CanteenAPI.login(u, p);
}

export async function fetcher(
  _cache?: CacheData<WidgetContent, AditionalCache>
): Promise<FetcherResult<WidgetContent, AditionalCache>> {
  console.log('[widget] Canteen (iOS): fetching today lunch from network');
  await ensureCanteenLogin();
  const page = await CanteenAPI.getMenuPage();
  const theme = await getAppThemeColors();
  return { data: { page, theme }, aditionalCache: {} };
}
