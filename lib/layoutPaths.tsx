import { createContext, useContext, type ReactNode } from 'react';

export interface LayoutPaths {
  timetable: string;
  grades: string;
  more: string;
  novinky: string;
  substitution: string;
  teachersList: string;
  teacher: (tag: string) => string;
  roomsList: string;
  room: (code: string) => string;
  prichody: string;
  omluvnyList: string;
  jidelna: string;
  burza: string;
  dokumenty: string;
  dokumentyFolder: (relativePath: string) => string;
  settings: string;
  settingsAccount: string;
  settingsAppearance: string;
  settingsDashboard: string;
  settingsNotifications: string;
  settingsExtraordinarySchedule: string;
  settingsAdvancedSettings: string;
  settingsAbout: string;
  settingsDebug: string;
  settingsSdeleni: string;
}

const LayoutPathsContext = createContext<LayoutPaths | null>(null);

export function LayoutPathsProvider({
  paths,
  children,
}: {
  paths: LayoutPaths;
  children: ReactNode;
}) {
  return (
    <LayoutPathsContext.Provider value={paths}>
      {children}
    </LayoutPathsContext.Provider>
  );
}

export function useLayoutPaths(): LayoutPaths {
  const paths = useContext(LayoutPathsContext);
  if (!paths) {
    throw new Error('useLayoutPaths must be used within a LayoutPathsProvider');
  }
  return paths;
}

export const drawerPaths: LayoutPaths = {
  timetable: '/drawer/rozvrh',
  grades: '/drawer/znamky',
  more: '/drawer/more',
  novinky: '/drawer/novinky',
  substitution: '/drawer/substitution',
  teachersList: '/drawer/teachers-list',
  teacher: tag => `/drawer/teachers/${tag}`,
  roomsList: '/drawer/rooms-list',
  room: code => `/drawer/ucebna/${code}`,
  prichody: '/drawer/prichody',
  omluvnyList: '/drawer/omluvny-list',
  jidelna: '/drawer/jidelna',
  burza: '/drawer/burza',
  dokumenty: '/drawer/dokumenty',
  dokumentyFolder: relativePath => `/drawer/dokumenty/${relativePath}`,
  settings: '/drawer/settings',
  settingsAccount: '/drawer/settings/account',
  settingsAppearance: '/drawer/settings/appearance',
  settingsDashboard: '/drawer/settings/dashboard',
  settingsNotifications: '/drawer/settings/notifications',
  settingsExtraordinarySchedule: '/drawer/settings/extraordinarySchedule',
  settingsAdvancedSettings: '/drawer/settings/advancedSettings',
  settingsAbout: '/drawer/settings/about',
  settingsDebug: '/drawer/settings/debug',
  settingsSdeleni: '/drawer/settings/sdeleni',
};

export const tabsPaths: LayoutPaths = {
  timetable: '/tabs/rozvrh',
  grades: '/tabs/znamky',
  more: '/tabs/more',
  novinky: '/tabs/more/novinky',
  substitution: '/tabs/more/substitution',
  teachersList: '/tabs/more/teachers-list',
  teacher: tag => `/tabs/more/teachers/${tag}`,
  roomsList: '/tabs/more/rooms-list',
  room: code => `/tabs/more/ucebna/${code}`,
  prichody: '/tabs/more/prichody',
  omluvnyList: '/tabs/more/omluvny-list',
  jidelna: '/tabs/more/jidelna',
  burza: '/tabs/more/burza',
  dokumenty: '/tabs/more/dokumenty',
  dokumentyFolder: relativePath => `/tabs/more/dokumenty/${relativePath}`,
  settings: '/tabs/more/settings',
  settingsAccount: '/tabs/more/settings/account',
  settingsAppearance: '/tabs/more/settings/appearance',
  settingsDashboard: '/tabs/more/settings/dashboard',
  settingsNotifications: '/tabs/more/settings/notifications',
  settingsExtraordinarySchedule: '/tabs/more/settings/extraordinarySchedule',
  settingsAdvancedSettings: '/tabs/more/settings/advancedSettings',
  settingsAbout: '/tabs/more/settings/about',
  settingsDebug: '/tabs/more/settings/debug',
  settingsSdeleni: '/tabs/more/settings/sdeleni',
};
