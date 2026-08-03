'use no memo';

import {
  FlexWidget,
  TextWidget,
  IconWidget,
} from 'react-native-android-widget';
import { FetcherResult, WidgetData, WidgetProps } from '../task-handler';
import { getAppThemeColors } from '@/hooks/useAppTheme';
import type { ThemeColorsWithColorProp } from '@/hooks/useAppTheme';
import Constants from 'expo-constants';
import { Canteen as CanteenAPI } from '@jzitnik/jecnaapi-react-native';
import { MenuPage } from '@jzitnik/jecnaapi-react-native/canteen';
import { getItemAsync } from 'expo-secure-store';
import { findOrderedLunch } from '@/utils/canteen/todayLunch';

type Data = { page: MenuPage; theme: ThemeColorsWithColorProp };
type AditionalCache = Record<string, never>;

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

async function fetcher(): Promise<FetcherResult<Data, AditionalCache>> {
  console.log('[widget] Canteen: fetching today lunch from network');
  await ensureCanteenLogin();
  const page = await CanteenAPI.getMenuPage();
  const theme = await getAppThemeColors();
  return { data: { page, theme }, aditionalCache: {} };
}

const APP_SCHEME = Constants.expoConfig?.scheme
  ? `${Constants.expoConfig.scheme}://`
  : 'jecnaapp://';

function CanteenWidget({ data }: WidgetProps<Data>) {
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

  const { page, theme } = data.content;
  const ordered = findOrderedLunch(page);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'column',
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <IconWidget
          font="material"
          icon="restaurant"
          size={22}
          style={{ color: theme.onSurface, marginRight: 8 }}
        />
        <TextWidget
          text="Dnešní jídlo"
          style={{ fontSize: 19, fontWeight: '700', color: theme.onSurface }}
        />
        <FlexWidget style={{ flex: 1 }} />
        <FlexWidget
          style={{
            backgroundColor: theme.surfaceVariant,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        >
          <TextWidget
            text={`${page.credit} Kč`}
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: theme.onSurface,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {ordered ? (
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: `${APP_SCHEME}drawer/jidelna` }}
          style={{
            width: 'match_parent',
            backgroundColor: theme.surfaceVariant,
            borderRadius: 14,
            padding: 14,
          }}
        >
          {ordered.description.soup ? (
            <>
              <TextWidget
                text="Polévka"
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: theme.onSurfaceVariant,
                  marginBottom: 2,
                }}
              />
              <TextWidget
                text={ordered.description.soup}
                maxLines={2}
                truncate="END"
                style={{
                  fontSize: 14,
                  color: theme.onSurface,
                  marginBottom: 10,
                }}
              />
            </>
          ) : null}
          <TextWidget
            text={`Jídlo ${ordered.number}`}
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: theme.onSurfaceVariant,
              marginBottom: 2,
            }}
          />
          <TextWidget
            text={ordered.description.rest}
            maxLines={2}
            truncate="END"
            style={{ fontSize: 14, color: theme.onSurface }}
          />
        </FlexWidget>
      ) : (
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: `${APP_SCHEME}drawer/jidelna` }}
          style={{
            flex: 1,
            width: 'match_parent',
            backgroundColor: theme.surfaceVariant,
            borderRadius: 14,
            padding: 16,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <IconWidget
            font="material"
            icon="restaurant"
            size={36}
            style={{ color: theme.onSurfaceVariant, marginBottom: 8 }}
          />
          <TextWidget
            text="Dnes nemáte objednané žádné jídlo"
            maxLines={2}
            truncate="END"
            style={{
              fontSize: 14,
              color: theme.onSurfaceVariant,
              textAlign: 'center',
            }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}

export const Canteen = {
  component: CanteenWidget,
  fetcher,
} satisfies WidgetData<Data, AditionalCache>;
