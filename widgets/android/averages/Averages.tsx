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
  GradesPage,
} from '@jzitnik/jecnaapi-react-native/jecnaapi';
import {
  formatFinalGrade,
  getWeightedAverage,
  gradeColor,
} from '@/utils/grades/gradesFormatting';

type Data = { grades: GradesPage; theme: ThemeColorsWithColorProp };
type AditionalCache = Record<string, never>;

async function fetcher(): Promise<FetcherResult<Data, AditionalCache>> {
  console.log('[widget] Averages: fetching grades page from network');
  const grades = await withLogin('getGradesPage');
  const theme = await getAppThemeColors();
  return { data: { grades, theme }, aditionalCache: {} };
}

const APP_SCHEME = Constants.expoConfig?.scheme
  ? `${Constants.expoConfig.scheme}://`
  : 'jecnaapp://';

function FinalGradeChip({ fg }: { fg: FinalGrade }) {
  return (
    <FlexWidget
      style={{
        backgroundColor: '#23272e',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 6,
      }}
    >
      <TextWidget
        text={formatFinalGrade(fg)}
        style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}
      />
    </FlexWidget>
  );
}

function AveragesWidget({ data }: WidgetProps<Data>) {
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
          icon="assessment"
          size={24}
          style={{ color: theme.onSurface, marginRight: 8 }}
        />
        <TextWidget
          text="Průměry"
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
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginVertical: 3,
                }}
              >
                <FlexWidget
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: 'match_parent',
                  }}
                >
                  <FlexWidget style={{ flex: 1, overflow: 'hidden' }}>
                    <TextWidget
                      text={subjectName}
                      maxLines={1}
                      truncate="END"
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: theme.onSurface,
                      }}
                    />
                  </FlexWidget>
                  {avg !== null && (
                    <FlexWidget
                      style={{
                        backgroundColor: gradeColor(avg),
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        marginLeft: 6,
                      }}
                    >
                      <TextWidget
                        text={avg.toFixed(2)}
                        style={{
                          color: '#ffffff',
                          fontWeight: 'bold',
                          fontSize: 14,
                        }}
                      />
                    </FlexWidget>
                  )}
                  {subject.finalGrade && (
                    <FinalGradeChip fg={subject.finalGrade} />
                  )}
                </FlexWidget>
              </FlexWidget>
            </FlexWidget>
          );
        })}
      </ListWidget>
    </FlexWidget>
  );
}

export const Averages = {
  component: AveragesWidget,
  fetcher,
} satisfies WidgetData<Data, AditionalCache>;
