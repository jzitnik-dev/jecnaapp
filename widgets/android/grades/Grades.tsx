'use no memo';

import {
  FlexWidget,
  TextWidget,
  IconWidget,
  ListWidget,
} from 'react-native-android-widget';
import { FetcherResult, WidgetData, WidgetProps } from '../task-handler';
import { getAppThemeColors } from '@/hooks/useAppTheme';
import type { ThemeColorsWithColorProp } from '@/hooks/useAppTheme';
import withLogin from '@/utils/external-fetching/withLogin';
import Constants from 'expo-constants';
import {
  FinalGrade,
  Grade,
  GradesPage,
} from '@jzitnik/jecnaapi-react-native/jecnaapi';
import {
  formatFinalGrade,
  getGradeText,
  getWeightedAverage,
  gradeColor,
} from '@/utils/grades/gradesFormatting';

type Data = { grades: GradesPage; theme: ThemeColorsWithColorProp };
type AditionalCache = Record<string, never>;

const SQUARES_PER_ROW = 6;
const GRADE_SQUARE_SIZE = 36;

function chunkRows(grades: Grade[], perRow: number): Grade[][] {
  const rows: Grade[][] = [];
  for (let i = 0; i < grades.length; i += perRow) {
    rows.push(grades.slice(i, i + perRow));
  }
  return rows;
}

async function fetcher(): Promise<FetcherResult<Data, AditionalCache>> {
  console.log('[widget] Grades: fetching grades page from network');
  const grades = await withLogin('getGradesPage');
  const theme = await getAppThemeColors();
  return { data: { grades, theme }, aditionalCache: {} };
}

const APP_SCHEME = Constants.expoConfig?.scheme
  ? `${Constants.expoConfig.scheme}://`
  : 'jecnaapp://';

function gradeDetailUri(subjectName: string, gradeId: number): string {
  return `${APP_SCHEME}drawer/znamky?gradeId=${gradeId}&subject=${encodeURIComponent(subjectName)}`;
}

function GradeSquare({
  grade,
  subjectName,
}: {
  grade: Grade;
  subjectName: string;
}) {
  const size = grade.small ? GRADE_SQUARE_SIZE / 2 : GRADE_SQUARE_SIZE;
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: gradeDetailUri(subjectName, grade.gradeId) }}
      style={{
        width: GRADE_SQUARE_SIZE,
        height: size,
        backgroundColor: gradeColor(grade.value),
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
        marginBottom: 2,
      }}
    >
      <TextWidget
        text={getGradeText(grade)}
        style={{
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: grade.small ? 12 : 16,
        }}
      />
    </FlexWidget>
  );
}

function FinalGradeChip({ fg }: { fg: FinalGrade }) {
  return (
    <FlexWidget
      style={{
        backgroundColor: '#23272e',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 2,
        marginLeft: 8,
      }}
    >
      <TextWidget
        text={formatFinalGrade(fg)}
        style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}
      />
    </FlexWidget>
  );
}

function GradesWidget({ data }: WidgetProps<Data>) {
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

  const { grades, theme } = data.content;

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
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
      >
        <IconWidget
          font="material"
          icon="grade"
          size={24}
          style={{ color: theme.onSurface, marginRight: 8 }}
        />
        <TextWidget
          text="Známky"
          style={{ fontSize: 20, fontWeight: '700', color: theme.onSurface }}
        />
      </FlexWidget>

      <ListWidget style={{ width: 'match_parent', height: 'match_parent' }}>
        {Object.entries(grades.subjectsMap).map(([subjectKey, subject]) => {
          const subjectName = subject.name.full;
          const allGrades = Object.values(
            subject.grades.subjectPartsGrades
          ).flat();
          const avg = getWeightedAverage(allGrades);

          return (
            <FlexWidget
              key={subjectKey}
              style={{
                width: 'match_parent',
                alignItems: 'center',
                flexDirection: 'row',
              }}
            >
              <FlexWidget
                clickAction="OPEN_URI"
                clickActionData={{
                  uri: `${APP_SCHEME}drawer/znamky?subject=${encodeURIComponent(subjectName)}`,
                }}
                style={{
                  width: 'match_parent',
                  backgroundColor: theme.surfaceVariant,
                  borderRadius: 14,
                  padding: 12,
                  marginVertical: 4,
                }}
              >
                <FlexWidget
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <FlexWidget style={{ flex: 1, overflow: 'hidden' }}>
                    <TextWidget
                      text={subjectName}
                      maxLines={1}
                      truncate="END"
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: theme.onSurface,
                      }}
                    />
                  </FlexWidget>
                  {subject.finalGrade && (
                    <FinalGradeChip fg={subject.finalGrade} />
                  )}
                </FlexWidget>

                {avg !== null && (
                  <FlexWidget
                    style={{
                      backgroundColor: '#23272e',
                      borderRadius: 14,
                      paddingHorizontal: 10,
                      paddingVertical: 2,
                      marginBottom: 6,
                    }}
                  >
                    <TextWidget
                      text={`Průměr: ${avg.toFixed(2)}`}
                      style={{
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: 13,
                      }}
                    />
                  </FlexWidget>
                )}

                {Object.entries(subject.grades.subjectPartsGrades).map(
                  ([partName, partGrades]) => (
                    <FlexWidget key={partName} style={{ marginBottom: 4 }}>
                      {partName !== 'null' && (
                        <TextWidget
                          text={`${partName}:`}
                          style={{
                            color: theme.onSurfaceVariant,
                            fontSize: 12,
                            marginBottom: 2,
                          }}
                        />
                      )}
                      {partGrades.length > 0 &&
                        chunkRows(partGrades, SQUARES_PER_ROW).map((row, i) => (
                          <FlexWidget
                            key={i}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}
                          >
                            {row.map(grade => (
                              <GradeSquare
                                key={grade.gradeId}
                                grade={grade}
                                subjectName={subjectName}
                              />
                            ))}
                          </FlexWidget>
                        ))}
                    </FlexWidget>
                  )
                )}
              </FlexWidget>
            </FlexWidget>
          );
        })}
      </ListWidget>
    </FlexWidget>
  );
}

export const Grades = {
  component: GradesWidget,
  fetcher,
} satisfies WidgetData<Data, AditionalCache>;
