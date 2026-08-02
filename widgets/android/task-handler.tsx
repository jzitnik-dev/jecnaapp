import { CurrentTimetable } from './current-timetable/CurrentTimetable';
import {
  cancelWidgetUpdate,
  scheduleWidgetUpdate,
} from '@/modules/widget-alarms/src/WidgetAlarms';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { JSX } from 'react/jsx-runtime';
import { WidgetName } from './config';

const nameToWidgetData: Record<WidgetName, WidgetData<any, any>> = {
  CurrentTimetable,
};

export interface WidgetData<T, U> {
  component: (props: WidgetProps<T>) => JSX.Element;
  fetcher: (cache?: CacheData<T, U>) => Promise<FetcherResult<T, U>>;
  clickHandler?: (
    clickAction: string,
    clickActionData: Record<string, unknown> | undefined,
    props: WidgetTaskHandlerProps
  ) => unknown;
  nextUpdate?: (result: FetcherResult<T, U>, now: Date) => number | null;
}

export type FetcherResult<T, U> = { data: T; aditionalCache: U };

export type CacheData<T, U> = FetcherResult<T, U> & { timestamp: number };

const CACHE_KEY_PREFIX = 'widget-cache';

async function loadWidgetCache<T, U>(
  widgetName: WidgetName
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
  widgetName: WidgetName,
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

async function clearWidgetCache(widgetName: WidgetName): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}:${widgetName}`);
  } catch (error) {
    console.warn(`[widget] ${widgetName}: cache clear failed`, error);
  }
}

export type Data<T> =
  | {
      type: 'data';
      content: T;
    }
  | { type: 'fetching' }
  | { type: 'error'; content: Error };

export interface WidgetProps<T> {
  data: Data<T>;
  handlerProps: WidgetTaskHandlerProps;
}

function renderAndSchedule<T, U>(
  props: WidgetTaskHandlerProps,
  widgetName: WidgetName,
  widgetData: WidgetData<T, U>,
  result: FetcherResult<T, U>
) {
  const Widget = widgetData.component;
  console.log(`[widget] ${widgetName}: rendering data (${props.widgetAction})`);
  props.renderWidget(
    <Widget
      data={{ type: 'data', content: result.data }}
      handlerProps={props}
    />
  );

  const nextUpdateAt = widgetData.nextUpdate?.(result, new Date());
  if (nextUpdateAt == null) {
    cancelWidgetUpdate(widgetName);
  } else {
    scheduleWidgetUpdate(widgetName, nextUpdateAt);
  }
}

function renderError<T, U>(
  props: WidgetTaskHandlerProps,
  widgetName: WidgetName,
  widgetData: WidgetData<T, U>,
  error: unknown
) {
  const Widget = widgetData.component;
  const safeError = error instanceof Error ? error : new Error(String(error));
  console.error(`[widget] ${widgetName}: rendering error state:`, safeError);
  props.renderWidget(
    <Widget data={{ type: 'error', content: safeError }} handlerProps={props} />
  );
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const widgetName = widgetInfo.widgetName as WidgetName;
  const widgetData = nameToWidgetData[widgetInfo.widgetName as WidgetName];
  const Widget = widgetData.component;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
      props.renderWidget(
        <Widget data={{ type: 'fetching' }} handlerProps={props} />
      );

      try {
        const result = await widgetData.fetcher();

        await saveWidgetCache(widgetName, {
          ...result,
          timestamp: new Date().getTime(),
        });

        renderAndSchedule(props, widgetName, widgetData, result);
      } catch (error) {
        console.error(`[widget] ${widgetName}: WIDGET_ADDED fetch failed`);
        renderError(props, widgetName, widgetData, error);
      }
      break;

    case 'WIDGET_RESIZED':
      const cached = await loadWidgetCache(widgetName);
      if (cached) {
        renderAndSchedule(props, widgetName, widgetData, {
          data: cached.data,
          aditionalCache: cached.aditionalCache,
        });
      } else {
        props.renderWidget(
          <Widget data={{ type: 'fetching' }} handlerProps={props} />
        );

        try {
          const result = await widgetData.fetcher();
          await saveWidgetCache(widgetName, {
            ...result,
            timestamp: new Date().getTime(),
          });

          renderAndSchedule(props, widgetName, widgetData, result);
        } catch (error) {
          console.error(`[widget] ${widgetName}: WIDGET_RESIZED fetch failed`);
          renderError(props, widgetName, widgetData, error);
        }
      }

      break;

    case 'WIDGET_UPDATE':
      const cachedData = await loadWidgetCache(widgetName);

      try {
        const result = await widgetData.fetcher(cachedData);

        await saveWidgetCache(widgetName, {
          ...result,
          timestamp: new Date().getTime(),
        });

        renderAndSchedule(props, widgetName, widgetData, result);
      } catch (error) {
        if (cachedData) {
          renderAndSchedule(props, widgetName, widgetData, {
            data: cachedData.data,
            aditionalCache: cachedData.aditionalCache,
          });
        } else {
          renderError(props, widgetName, widgetData, error);
        }
      }
      break;

    case 'WIDGET_DELETED':
      cancelWidgetUpdate(widgetName);
      await clearWidgetCache(widgetName);
      break;

    case 'WIDGET_CLICK':
      if (!props.clickAction) {
        break;
      }

      widgetData.clickHandler?.(
        props.clickAction,
        props.clickActionData,
        props
      );
      break;

    default:
      break;
  }
}
