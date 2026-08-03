import { createWidget } from 'expo-widgets';
import type { WidgetEnvironment } from 'expo-widgets';
import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  containerBackground,
  cornerRadius,
  font,
  foregroundStyle,
  lineLimit,
  padding,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import type { JSX } from 'react/jsx-runtime';
import type { WidgetData, WidgetProps } from '../task-handler';
import { AditionalCache, WidgetContent, fetcher } from './fetcher';
import {
  formatFinalGrade,
  getWeightedAverage,
  gradeColor,
} from '@/utils/grades/gradesFormatting';

function AveragesWidget(
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

  const { grades, theme } = data.content;
  const subjectsEntries = Object.entries(grades.subjectsMap);
  const maxSubjects = isSmall ? 3 : isMedium ? 5 : 10;
  const visibleSubjects = subjectsEntries.slice(0, maxSubjects);

  return (
    <VStack
      alignment="leading"
      spacing={8}
      modifiers={[containerBackground(theme.surface, 'widget')]}
    >
      <HStack spacing={6}>
        <Image systemName="chart.bar.fill" size={18} color={theme.onSurface} />
        <Text
          modifiers={[
            font({ size: 16, weight: 'bold' }),
            foregroundStyle(theme.onSurface),
          ]}
        >
          Průměry
        </Text>
      </HStack>

      <VStack alignment="leading" spacing={4}>
        {visibleSubjects.map(([subjectKey, subject]) => {
          const subjectName = subject.name.full;
          const allGrades = Object.values(
            subject.grades.subjectPartsGrades
          ).flat();
          const avg = getWeightedAverage(allGrades);

          return (
            <HStack
              key={subjectKey}
              spacing={6}
              modifiers={[
                background(
                  theme.surfaceVariant,
                  shapes.roundedRectangle({ cornerRadius: 8 })
                ),
                padding({ horizontal: 8, vertical: 6 }),
                cornerRadius(8),
              ]}
            >
              <Text
                modifiers={[
                  font({ size: 13, weight: 'semibold' }),
                  foregroundStyle(theme.onSurface),
                  lineLimit(1),
                ]}
              >
                {subjectName}
              </Text>
              <Spacer />
              {avg !== null && (
                <Text
                  modifiers={[
                    font({ size: 12, weight: 'bold' }),
                    foregroundStyle('#ffffff'),
                    background(
                      gradeColor(avg),
                      shapes.roundedRectangle({ cornerRadius: 6 })
                    ),
                    padding({ horizontal: 6, vertical: 2 }),
                  ]}
                >
                  {avg.toFixed(2)}
                </Text>
              )}
              {subject.finalGrade && (
                <Text
                  modifiers={[
                    font({ size: 11, weight: 'bold' }),
                    foregroundStyle('#ffffff'),
                    background(
                      '#23272e',
                      shapes.roundedRectangle({ cornerRadius: 6 })
                    ),
                    padding({ horizontal: 6, vertical: 2 }),
                  ]}
                >
                  {formatFinalGrade(subject.finalGrade)}
                </Text>
              )}
            </HStack>
          );
        })}
      </VStack>
    </VStack>
  );
}

export const Averages = {
  component: AveragesWidget,
  fetcher,
} satisfies WidgetData<WidgetContent, AditionalCache>;

export const AveragesWidgetInstance = createWidget<WidgetProps<WidgetContent>>(
  'Averages',
  AveragesWidget
);
