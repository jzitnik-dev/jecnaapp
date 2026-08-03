import { createWidget } from 'expo-widgets';
import type { WidgetEnvironment } from 'expo-widgets';
import {
  HStack,
  Image,
  Rectangle,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  background,
  containerBackground,
  cornerRadius,
  font,
  foregroundStyle,
  frame,
  layoutPriority,
  lineLimit,
  padding,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import type { JSX } from 'react/jsx-runtime';
import type { WidgetData, WidgetProps } from '../task-handler';
import { AditionalCache, WidgetContent, fetcher, nextUpdate } from './fetcher';
import type { LessonInfo } from '@/utils/dashboard/nextClass';

function CurrentTimetableWidget(
  props: WidgetProps<WidgetContent>,
  environment: WidgetEnvironment
): JSX.Element {
  'widget';

  const ACCENT_CURRENT = '#4CAF50'; // green — currently happening
  const ACCENT_NEXT = '#9C27B0'; // purple — coming up next
  const ACCENT_EXTRAORDINARY = '#FF9800'; // orange — schedule change

  function LessonBlock({
    lesson,
    isCurrent,
    theme,
  }: {
    lesson: LessonInfo;
    isCurrent: boolean;
    theme: WidgetContent['theme'];
  }) {
    const isExtraordinary = lesson.kind === 'extraordinary';

    const accentColor = isExtraordinary
      ? ACCENT_EXTRAORDINARY
      : isCurrent
        ? ACCENT_CURRENT
        : ACCENT_NEXT;

    const bgColor = theme.surfaceVariant;
    const textColor = theme.onSurface;
    const textVariant = theme.onSurfaceVariant;

    const statusText = isExtraordinary
      ? 'Mimořádná změna!'
      : isCurrent
        ? 'Právě probíhá'
        : 'Další hodina';

    const statusIcon = isExtraordinary
      ? 'exclamationmark.triangle.fill'
      : isCurrent
        ? 'play.circle.fill'
        : 'clock.fill';

    const countdownVal = isCurrent
      ? lesson.timeUntilEnd
      : lesson.timeUntilStart;
    const countdownLabel = isCurrent ? 'do konce' : 'do začátku';
    const title = isExtraordinary ? lesson.extraOrdinaryData : lesson.subject;

    return (
      <HStack
        spacing={0}
        modifiers={[
          background(bgColor, shapes.roundedRectangle({ cornerRadius: 12 })),
          cornerRadius(12),
        ]}
      >
        <Rectangle
          modifiers={[frame({ width: 6 }), foregroundStyle(accentColor)]}
        />

        <VStack
          alignment="leading"
          spacing={6}
          modifiers={[padding({ all: 12 }), layoutPriority(1)]}
        >
          {/* Header: Status and Countdown */}
          <HStack spacing={6}>
            <Image systemName={statusIcon} size={16} color={accentColor} />
            <Text
              modifiers={[
                font({ size: 14, weight: 'semibold' }),
                foregroundStyle(accentColor),
                lineLimit(1),
              ]}
            >
              {statusText}
            </Text>
            <Spacer />
            <VStack alignment="trailing" spacing={0}>
              <Text
                modifiers={[
                  font({ size: 14, weight: 'semibold' }),
                  foregroundStyle(accentColor),
                ]}
              >
                {countdownVal || ''}
              </Text>
              <Text
                modifiers={[font({ size: 10 }), foregroundStyle(textVariant)]}
              >
                {countdownLabel}
              </Text>
            </VStack>
          </HStack>

          {/* Subject & Time Info */}
          <VStack alignment="leading" spacing={2}>
            <Text
              modifiers={[
                font({ size: 18, weight: 'bold' }),
                foregroundStyle(textColor),
                lineLimit(1),
              ]}
            >
              {title}
            </Text>
            <Text
              modifiers={[
                font({ size: 12 }),
                foregroundStyle(textVariant),
                lineLimit(1),
              ]}
            >
              {`${lesson.time} • ${lesson.period}. hodina`}
            </Text>
          </VStack>

          {/* Lesson Details */}
          {!isExtraordinary && (
            <VStack alignment="leading" spacing={4}>
              <HStack spacing={6}>
                <Image systemName="person.fill" size={12} color={textColor} />
                <Text
                  modifiers={[
                    font({ size: 12, weight: 'medium' }),
                    foregroundStyle(textColor),
                    lineLimit(1),
                  ]}
                >
                  {lesson.teacherFull}
                </Text>
              </HStack>
              <HStack spacing={6}>
                <Image
                  systemName="door.left.hand.open"
                  size={12}
                  color={textVariant}
                />
                <Text
                  modifiers={[
                    font({ size: 12, weight: 'medium' }),
                    foregroundStyle(textVariant),
                    lineLimit(1),
                  ]}
                >
                  {lesson.room}
                </Text>
              </HStack>
              {lesson.group ? (
                <HStack spacing={6}>
                  <Image
                    systemName="person.2.fill"
                    size={12}
                    color={textVariant}
                  />
                  <Text
                    modifiers={[
                      font({ size: 12, weight: 'medium' }),
                      foregroundStyle(textVariant),
                      lineLimit(1),
                    ]}
                  >
                    {lesson.group}
                  </Text>
                </HStack>
              ) : null}
            </VStack>
          )}
        </VStack>
      </HStack>
    );
  }

  const data = props.data;
  const isSmall = environment.widgetFamily === 'systemSmall';

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

  const content = data.content;
  const theme = content.theme;
  const schedule = content.data;
  const currentLessons = schedule?.currentLessons || [];
  const nextLessons = schedule?.nextLessons || [];
  const hasLessons = currentLessons.length > 0 || nextLessons.length > 0;

  const lessons = [
    ...currentLessons.map(lesson => ({ lesson, isCurrent: true })),
    ...nextLessons.map(lesson => ({ lesson, isCurrent: false })),
  ];
  const visibleLessons = isSmall ? lessons.slice(0, 1) : lessons.slice(0, 2);

  return (
    <VStack
      alignment="leading"
      spacing={10}
      modifiers={[containerBackground(theme.surface, 'widget')]}
    >
      <HStack spacing={6}>
        <Image systemName="calendar" size={18} color={theme.onSurface} />
        <Text
          modifiers={[
            font({ size: 16, weight: 'bold' }),
            foregroundStyle(theme.onSurface),
          ]}
        >
          Rozvrh hodin
        </Text>
      </HStack>

      {!hasLessons ? (
        <VStack alignment="center" spacing={8}>
          <Spacer />
          <Image
            systemName="checkmark.circle"
            size={40}
            color={theme.onSurfaceVariant}
          />
          <Text
            modifiers={[
              font({ size: 14 }),
              foregroundStyle(theme.onSurfaceVariant),
            ]}
          >
            Žádné další hodiny dnes
          </Text>
          <Spacer />
        </VStack>
      ) : (
        <VStack alignment="leading" spacing={8}>
          {visibleLessons.map(({ lesson, isCurrent }, index) => (
            <LessonBlock
              key={index}
              lesson={lesson}
              isCurrent={isCurrent}
              theme={theme}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
}

export const CurrentTimetable = {
  component: CurrentTimetableWidget,
  fetcher,
  nextUpdate,
} satisfies WidgetData<WidgetContent, AditionalCache>;

export const CurrentTimetableWidgetInstance = createWidget<
  WidgetProps<WidgetContent>
>('CurrentTimetable', CurrentTimetableWidget);
