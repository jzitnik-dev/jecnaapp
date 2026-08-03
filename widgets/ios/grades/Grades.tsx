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
import { Grade } from '@jzitnik/jecnaapi-react-native/jecnaapi';

function GradeSquare({ grade }: { grade: Grade }) {
  return (
    <Text
      modifiers={[
        font({ size: grade.small ? 11 : 13, weight: 'bold' }),
        foregroundStyle('#ffffff'),
        background(
          gradeColor(grade.value),
          shapes.roundedRectangle({ cornerRadius: 4 })
        ),
        padding({ horizontal: 6, vertical: 3 }),
      ]}
    >
      {String(grade.value)}
    </Text>
  );
}

function GradesWidget(
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
  const maxSubjects = isSmall ? 2 : isMedium ? 3 : 7;
  const visibleSubjects = subjectsEntries.slice(0, maxSubjects);

  return (
    <VStack
      alignment="leading"
      spacing={8}
      modifiers={[containerBackground(theme.surface, 'widget')]}
    >
      <HStack spacing={6}>
        <Image systemName="bookmark.fill" size={18} color={theme.onSurface} />
        <Text
          modifiers={[
            font({ size: 16, weight: 'bold' }),
            foregroundStyle(theme.onSurface),
          ]}
        >
          Známky
        </Text>
      </HStack>

      <VStack alignment="leading" spacing={6}>
        {visibleSubjects.map(([subjectKey, subject]) => {
          const subjectName = subject.name.full;
          const allGrades = Object.values(
            subject.grades.subjectPartsGrades
          ).flat();
          const avg = getWeightedAverage(allGrades);
          const recentGrades = isSmall
            ? allGrades.slice(-3)
            : allGrades.slice(-6);

          return (
            <VStack
              key={subjectKey}
              alignment="leading"
              spacing={4}
              modifiers={[
                background(
                  theme.surfaceVariant,
                  shapes.roundedRectangle({ cornerRadius: 10 })
                ),
                padding({ all: 8 }),
                cornerRadius(10),
              ]}
            >
              <HStack spacing={4}>
                <Text
                  modifiers={[
                    font({ size: 13, weight: 'bold' }),
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
                      font({ size: 11, weight: 'bold' }),
                      foregroundStyle('#ffffff'),
                      background(
                        '#23272e',
                        shapes.roundedRectangle({ cornerRadius: 4 })
                      ),
                      padding({ horizontal: 5, vertical: 2 }),
                    ]}
                  >
                    {`⌀ ${avg.toFixed(2)}`}
                  </Text>
                )}
                {subject.finalGrade && (
                  <Text
                    modifiers={[
                      font({ size: 11, weight: 'bold' }),
                      foregroundStyle('#ffffff'),
                      background(
                        '#23272e',
                        shapes.roundedRectangle({ cornerRadius: 4 })
                      ),
                      padding({ horizontal: 5, vertical: 2 }),
                    ]}
                  >
                    {formatFinalGrade(subject.finalGrade)}
                  </Text>
                )}
              </HStack>

              {recentGrades.length > 0 && (
                <HStack spacing={4}>
                  {recentGrades.map((g, idx) => (
                    <GradeSquare key={g.gradeId || idx} grade={g} />
                  ))}
                </HStack>
              )}
            </VStack>
          );
        })}
      </VStack>
    </VStack>
  );
}

export const Grades = {
  component: GradesWidget,
  fetcher,
} satisfies WidgetData<WidgetContent, AditionalCache>;

export const GradesWidgetInstance = createWidget<WidgetProps<WidgetContent>>(
  'Grades',
  GradesWidget
);
