import { CurrentTimetable } from './current-timetable/CurrentTimetable';

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
}

export type FetcherResult<T, U> = { data: T; aditionalCache: U };

export type CacheData<T, U> = FetcherResult<T, U> & { timestamp: number };

const widgetCache = new Map<WidgetName, CacheData<any, any>>();

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
        const { data, aditionalCache } = await widgetData.fetcher();

        widgetCache.set(widgetName, {
          data,
          aditionalCache,
          timestamp: new Date().getTime(),
        });

        props.renderWidget(
          <Widget data={{ type: 'data', content: data }} handlerProps={props} />
        );
      } catch (error) {
        const safeError =
          error instanceof Error ? error : new Error(String(error));
        props.renderWidget(
          <Widget
            data={{ type: 'error', content: safeError }}
            handlerProps={props}
          />
        );
      }
      break;

    case 'WIDGET_RESIZED':
      const cached = widgetCache.get(widgetName);
      if (cached) {
        props.renderWidget(
          <Widget
            data={{ type: 'data', content: cached.data }}
            handlerProps={props}
          />
        );
      } else {
        props.renderWidget(
          <Widget data={{ type: 'fetching' }} handlerProps={props} />
        );

        const { data, aditionalCache } = await widgetData.fetcher();
        widgetCache.set(widgetName, {
          data,
          aditionalCache,
          timestamp: new Date().getTime(),
        });

        props.renderWidget(
          <Widget data={{ type: 'data', content: data }} handlerProps={props} />
        );
      }

      break;

    case 'WIDGET_UPDATE':
      const cachedData = widgetCache.get(widgetName);
      const data = await widgetData.fetcher(cachedData);

      props.renderWidget(
        <Widget data={{ type: 'data', content: data }} handlerProps={props} />
      );
      break;

    case 'WIDGET_DELETED':
      // Not needed for now
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
