import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import type { JSX } from 'react/jsx-runtime';
import type { Widget, WidgetEnvironment } from 'expo-widgets';

import type { IOSWidgetName } from './config';
import {
  CurrentTimetable,
  CurrentTimetableWidgetInstance,
} from './current-timetable/CurrentTimetable';

const CACHE_KEY_PREFIX = 'widget-cache';

export interface WidgetData<T, U> {
  component: (
    props: WidgetProps<T>,
    environment: WidgetEnvironment
  ) => JSX.Element;
  fetcher: (cache?: CacheData<T, U>) => Promise<FetcherResult<T, U>>;
  nextUpdate?: (result: FetcherResult<T, U>, now: Date) => number | null;
}

export type FetcherResult<T, U> = { data: T; aditionalCache: U };

export type CacheData<T, U> = FetcherResult<T, U> & { timestamp: number };

export type Data<T> =
  | {
      type: 'data';
      content: T;
    }
  | { type: 'fetching' }
  | { type: 'error'; content: Error };

export interface WidgetProps<T> {
  data: Data<T>;
}

const nameToWidgetData: Record<IOSWidgetName, WidgetData<any, any>> = {
  CurrentTimetable,
};

const widgetInstances: Record<IOSWidgetName, Widget<any, any>> = {
  CurrentTimetable: CurrentTimetableWidgetInstance,
};

export const IOS_TIMETABLE_TASK = 'ios-timetable-widget-refresh';

async function loadWidgetCache<T, U>(
  widgetName: IOSWidgetName
): Promise<CacheData<T, U> | undefined> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}:${widgetName}`);
    if (raw == null) return undefined;
    const parsed = JSON.parse(raw) as CacheData<T, U>;
    if (typeof parsed.timestamp !== 'number') return undefined;
    return parsed;
  } catch (error) {
    console.warn(
      `[widget] ${widgetName}: cache load failed, treating as missing`,
      error
    );
    return undefined;
  }
}

async function saveWidgetCache<T, U>(
  widgetName: IOSWidgetName,
  cache: CacheData<T, U>
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `${CACHE_KEY_PREFIX}:${widgetName}`,
      JSON.stringify(cache)
    );
  } catch (error) {
    console.warn(
      `[widget] ${widgetName}: cache save failed (will continue without cache)`,
      error
    );
  }
}

function renderAndSchedule<T, U>(
  widgetName: IOSWidgetName,
  widgetData: WidgetData<T, U>,
  result: FetcherResult<T, U>
) {
  console.log(`[widget] ${widgetName}: rendering data`);
  const widgetInstance = widgetInstances[widgetName];
  const props: WidgetProps<T> = {
    data: { type: 'data', content: result.data },
  };

  const nextUpdateAt = widgetData.nextUpdate?.(result, new Date());
  if (nextUpdateAt == null) {
    widgetInstance.updateSnapshot(props);
  } else {
    widgetInstance.updateTimeline([
      { date: new Date(), props },
      { date: new Date(nextUpdateAt), props },
    ]);
  }
}

function renderError<T, U>(
  widgetName: IOSWidgetName,
  widgetData: WidgetData<T, U>,
  error: unknown
) {
  const safeError = error instanceof Error ? error : new Error(String(error));
  console.error(`[widget] ${widgetName}: rendering error state:`, safeError);
  widgetInstances[widgetName].updateSnapshot({
    data: { type: 'error', content: safeError },
  } satisfies WidgetProps<T>);
}

export async function widgetTaskHandler(widgetName: IOSWidgetName) {
  const widgetData = nameToWidgetData[widgetName];
  const cachedData = await loadWidgetCache(widgetName);

  try {
    const result = await widgetData.fetcher(cachedData);

    await saveWidgetCache(widgetName, {
      ...result,
      timestamp: new Date().getTime(),
    });

    renderAndSchedule(widgetName, widgetData, result);
  } catch (error) {
    console.error(`[widget] ${widgetName}: refresh failed`);
    if (cachedData) {
      renderAndSchedule(widgetName, widgetData, {
        data: cachedData.data,
        aditionalCache: cachedData.aditionalCache,
      });
    } else {
      renderError(widgetName, widgetData, error);
    }
  }
}

TaskManager.defineTask(IOS_TIMETABLE_TASK, async () => {
  try {
    await widgetTaskHandler('CurrentTimetable');
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('[widget] background refresh failed:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerIOSWidgetUpdates(): Promise<void> {
  try {
    await BackgroundTask.registerTaskAsync(IOS_TIMETABLE_TASK, {
      minimumInterval: 15,
    });
  } catch (error) {
    console.error('[widget] background task registration failed:', error);
  }

  AppState.addEventListener('change', state => {
    if (state === 'active') {
      widgetTaskHandler('CurrentTimetable');
    }
  });
}
