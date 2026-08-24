import * as SecureStore from 'expo-secure-store';

export interface WidgetPaths {
  rozvrh: string;
  znamky: string;
  jidelna: string;
  teacher: (tag: string) => string;
  room: (code: string) => string;
}

const drawerWidgetPaths: WidgetPaths = {
  rozvrh: 'drawer/rozvrh',
  znamky: 'drawer/znamky',
  jidelna: 'drawer/jidelna',
  teacher: tag => `drawer/teachers/${tag}`,
  room: code => `drawer/ucebna/${code}`,
};

const tabsWidgetPaths: WidgetPaths = {
  rozvrh: 'tabs/rozvrh',
  znamky: 'tabs/znamky',
  jidelna: 'tabs/more/jidelna',
  teacher: tag => `tabs/more/teachers/${tag}`,
  room: code => `tabs/more/ucebna/${code}`,
};

let currentPaths: WidgetPaths = drawerWidgetPaths;

export async function loadWidgetPaths(): Promise<WidgetPaths> {
  try {
    const layout = await SecureStore.getItemAsync('drawer-layout');
    currentPaths = layout === 'tab' ? tabsWidgetPaths : drawerWidgetPaths;
  } catch (error) {
    console.warn(
      '[widget] failed to load layout preference, defaulting to drawer',
      error
    );
  }
  return currentPaths;
}

export function getWidgetPaths(): WidgetPaths {
  return currentPaths;
}
