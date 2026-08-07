import { createWidget } from 'expo-widgets';
import type { WidgetEnvironment } from 'expo-widgets';
import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  containerBackground,
  cornerRadius,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import type { JSX } from 'react/jsx-runtime';
import type { WidgetData, WidgetProps } from '../task-handler';
import { AditionalCache, WidgetContent, fetcher } from './fetcher';
import type { DayLesson } from '@/utils/dashboard/dayLessons';

const ACCENT_EXTRAORDINARY = '#FF9800';

function LessonItem({
  lesson,
  theme,
}: {
  lesson: DayLesson;
  theme: WidgetContent['theme'];
}) {
  const isExtraordinary = lesson.kind === 'extraordinary';
  const parts = isExtraordinary ? [] : lesson.parts;

  return (
    <HStack
      spacing={8}
      modifiers={[
        background(
          theme.surfaceVariant,
          shapes.roundedRectangle({ cornerRadius: 8 })
        ),
        padding({ horizontal: 8, vertical: 6 }),
        cornerRadius(8),
      ]}
    >
      <VStack
        alignment="leading"
        spacing={0}
        modifiers={[frame({ width: 40 })]}
      >
        <Text
          modifiers={[
            font({ size: 14, weight: 'bold' }),
            foregroundStyle(
              isExtraordinary ? ACCENT_EXTRAORDINARY : theme.onSurface
            ),
          ]}
        >
          {`${lesson.period}.`}
        </Text>
        <Text
          modifiers={[
            font({ size: 10 }),
            foregroundStyle(theme.onSurfaceVariant),
          ]}
        >
          {lesson.startTime}
        </Text>
      </VStack>

      {isExtraordinary ? (
        <HStack spacing={4}>
          <Image
            systemName="exclamationmark.triangle.fill"
            size={14}
            color={ACCENT_EXTRAORDINARY}
          />
          <Text
            modifiers={[
              font({ size: 12, weight: 'bold' }),
              foregroundStyle(ACCENT_EXTRAORDINARY),
              lineLimit(1),
            ]}
          >
            {lesson.extraOrdinaryData}
          </Text>
        </HStack>
      ) : (
        <VStack alignment="leading" spacing={2}>
          {parts.map((part, i) => (
            <HStack key={i} spacing={4}>
              <Text
                modifiers={[
                  font({ size: 13, weight: 'semibold' }),
                  foregroundStyle(theme.onSurface),
                  lineLimit(1),
                ]}
              >
                {part.group ? `${part.subject} ${part.group}` : part.subject}
              </Text>
              <Spacer />
              {part.room ? (
                <Text
                  modifiers={[
                    font({ size: 11 }),
                    foregroundStyle(theme.onSurfaceVariant),
                  ]}
                >
                  {part.room}
                </Text>
              ) : null}
            </HStack>
          ))}
        </VStack>
      )}
    </HStack>
  );
}

function TodaysClassesWidget(
  props: WidgetProps<WidgetContent>,
  environment: WidgetEnvironment
): JSX.Element {
  'widget';

  const data = props.data;
  const isSmall = environment.widgetFamily === 'systemSmall';
  const isMedium = environment.widgetFamily === 'systemMedium';

  if (!data || data.type === 'fetching') {
    return (
      <VStack
        alignment="center"
        modifiers={[containerBackground('#1a1a1a', 'widget')]}
      >
        <Spacer />
        <Text modifiers={[font({ size: 16 }), foregroundStyle('#ffffff')]}>
          Načítání...
        </Text>
        <Spacer />
      </VStack>
    );
  }

  if (data.type === 'error') {
    return (
      <VStack
        alignment="center"
        modifiers={[containerBackground('#1a1a1a', 'widget')]}
      >
        <Spacer />
        <Text modifiers={[font({ size: 16 }), foregroundStyle('#ffffff')]}>
          Chyba při načítání
        </Text>
        <Spacer />
      </VStack>
    );
  }

  const { lessons, dayFull, dateLabel, isToday, theme } = data.content;
  const title = isToday ? `Dnes · ${dateLabel}` : `${dayFull} · ${dateLabel}`;
  const maxLessons = isSmall ? 2 : isMedium ? 4 : 8;
  const visibleLessons = lessons.slice(0, maxLessons);

  return (
    <VStack
      alignment="leading"
      spacing={8}
      modifiers={[containerBackground(theme.surface, 'widget')]}
    >
      <HStack spacing={6}>
        <Image systemName="calendar" size={18} color={theme.onSurface} />
        <Text
          modifiers={[
            font({ size: 15, weight: 'bold' }),
            foregroundStyle(theme.onSurface),
            lineLimit(1),
          ]}
        >
          {title}
        </Text>
      </HStack>

      {lessons.length === 0 ? (
        <VStack alignment="center" spacing={8}>
          <Spacer />
          <Image
            systemName="checkmark.circle"
            size={36}
            color={theme.onSurfaceVariant}
          />
          <Text
            modifiers={[
              font({ size: 13 }),
              foregroundStyle(theme.onSurfaceVariant),
            ]}
          >
            Žádné hodiny
          </Text>
          <Spacer />
        </VStack>
      ) : (
        <VStack alignment="leading" spacing={4}>
          {visibleLessons.map((lesson, idx) => (
            <LessonItem key={idx} lesson={lesson} theme={theme} />
          ))}
        </VStack>
      )}
    </VStack>
  );
}

export const TodaysClasses = {
  component: TodaysClassesWidget,
  fetcher,
} satisfies WidgetData<WidgetContent, AditionalCache>;

export const TodaysClassesWidgetInstance = createWidget<
  WidgetProps<WidgetContent>
>('TodaysClasses', TodaysClassesWidget);
