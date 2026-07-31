import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
  Button,
  Chip,
  Modal as PaperModal,
  Portal,
  Text,
  useTheme,
} from 'react-native-paper';
import { HalfSelector, YearSelector } from '@/utils/selectors';

import {
  FinalGrade,
  Grade,
  SchoolYearHalf,
  Subject,
} from '@jzitnik/jecnaapi-react-native/jecnaapi';
import NotificationDetailModal from '@/components/ui/NotificationDetailModal';
import { JecnaAPI } from '@jzitnik/jecnaapi-react-native';
import { useLocalSearchParams } from 'expo-router/build/hooks';
import { Change } from '@/services/grades/changeDetectionLogic';

const gradeColor = (value: number) => {
  const colors = [
    [76, 175, 80], // 1: #4CAF50
    [139, 195, 74], // 2: #8BC34A
    [255, 193, 7], // 3: #FFC107
    [255, 152, 0], // 4: #FF9800
    [244, 67, 54], // 5: #F44336
  ];
  const idx = Math.round(value) - 1;
  const c = colors[idx] || [189, 189, 189];
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

const formatFinalGrade = (fg: FinalGrade): string => {
  switch (fg.type) {
    case 'Grade':
      return fg.value.toString();
    case 'GradesWarning':
      return 'N (5)';
    case 'AbsenceWarning':
      return 'N';
    case 'GradesAndAbsenceWarning':
      return 'N (5/Abs)';
    case 'Excused':
      return 'U';
    default:
      return '-';
  }
};

const GradeSquare = ({
  grade,
  onPress,
}: {
  grade: Grade;
  onPress: () => void;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.gradeSquare,
        {
          backgroundColor: gradeColor(grade.value),
          opacity: pressed ? 0.7 : 1,
          width: 44,
          height: grade.small ? 22 : 44,
        },
      ]}
    >
      <Text style={[styles.gradeText, grade.small ? { fontSize: 14 } : {}]}>
        {grade.value}
      </Text>
    </Pressable>
  );
};

function GradeDetailModal({
  visible,
  onClose,
  grade,
  subjectName,
}: {
  visible: boolean;
  onClose: () => void;
  grade: Grade | null;
  subjectName: string;
}) {
  const theme = useTheme();
  if (!grade) return null;

  return (
    <Portal>
      <PaperModal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[
          styles.paperModalContent,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
        theme={theme}
      >
        {subjectName !== 'null' && (
          <Text variant="titleLarge" style={{ marginBottom: 8 }}>
            {subjectName}
          </Text>
        )}
        <Text>
          Známka: <Text style={{ fontWeight: 'bold' }}>{grade.value}</Text>
        </Text>
        <Text>
          Typ:{' '}
          <Text style={{ fontWeight: 'bold' }}>
            {grade.small ? 'Malá' : 'Normální'}
          </Text>
        </Text>
        {grade.receiveDate && (
          <Text>
            Datum:{' '}
            <Text style={{ fontWeight: 'bold' }}>
              {new Date(grade.receiveDate).toLocaleDateString('cs-CZ')}
            </Text>
          </Text>
        )}
        {grade.teacher?.full && (
          <Text>
            Učitel:{' '}
            <Text style={{ fontWeight: 'bold' }}>{grade.teacher.full}</Text>
          </Text>
        )}
        {grade.description && (
          <Text>
            Poznámka:{' '}
            <Text style={{ fontWeight: 'bold' }}>{grade.description}</Text>
          </Text>
        )}
        <Button mode="contained" onPress={onClose} style={{ marginTop: 16 }}>
          Zavřít
        </Button>
      </PaperModal>
    </Portal>
  );
}

function getWeightedAverage(grades: Grade[]): number | null {
  if (grades.length === 0) return null;
  let sum = 0;
  let weightSum = 0;
  for (const g of grades) {
    const weight = g.small ? 0.5 : 1;
    sum += g.value * weight;
    weightSum += weight;
  }
  if (weightSum === 0) return null;
  return sum / weightSum;
}

// Special key used to track/scroll to the "Chování" (behaviour) block,
// since it isn't a subject and doesn't have a subject name.
const BEHAVIOUR_LAYOUT_KEY = '__behaviour__';

export default function ZnamkyScreen() {
  const { handleGradeChange } = useLocalSearchParams<{
    handleGradeChange?: string;
  }>();

  const theme = useTheme();

  const [selectedYear, setSelectedYear] = useState<number | undefined>(
    undefined
  );
  const [selectedHalf, setSelectedHalf] = useState<SchoolYearHalf>('FIRST');

  const [modal, setModal] = useState<{
    grade: Grade;
    subjectName: string;
  } | null>(null);

  const [plannerMode, setPlannerMode] = useState(false);
  const [hypotheticals, setHypotheticals] = useState<{
    [subjectName: string]: { value: number; small: boolean }[];
  }>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newGradeValue, setNewGradeValue] = useState<number>(1);
  const [newGradeSmall, setNewGradeSmall] = useState<boolean>(false);
  const [notificationDetail, setNotificationDetail] = useState<
    number | undefined
  >();

  const [highlightedBlock, setHighlightedBlock] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const blockLayoutY = useRef<Record<string, number>>({});
  const processedChangeRef = useRef<string | null>(null);

  const { data, error, refetch, isFetching } = useQuery({
    queryKey: ['znamky', selectedYear, selectedHalf],
    queryFn: async () => {
      if (selectedYear === undefined) {
        return JecnaAPI.getGradesPage();
      }
      return JecnaAPI.getGradesPage({
        firstCalendarYear: selectedYear,
        half: selectedHalf,
      });
    },
  });

  const getSubjectRealGrades = (subject: Subject): Grade[] => {
    if (!subject.grades?.subjectPartsGrades) return [];
    return Object.values(subject.grades.subjectPartsGrades).flat();
  };

  const getPlannedAverage = (subject: Subject) => {
    const realGrades = getSubjectRealGrades(subject);
    const hypotheticalsForSubject = hypotheticals[subject.name.full] || [];

    const hypotheticalsGrades: Grade[] = hypotheticalsForSubject.map(
      (g, i) => ({
        value: g.value,
        small: g.small,
        gradeId: -(i + 1),
      })
    );

    return getWeightedAverage([...realGrades, ...hypotheticalsGrades]);
  };

  const handleAddHypothetical = (subjectName: string) => {
    setHypotheticals(prev => ({
      ...prev,
      [subjectName]: [
        ...(prev[subjectName] || []),
        { value: newGradeValue, small: newGradeSmall },
      ],
    }));
    setShowAddModal(false);
    setAddingFor(null);
    setNewGradeValue(1);
    setNewGradeSmall(false);
  };

  const handleRemoveHypothetical = (subjectName: string, idx: number) => {
    setHypotheticals(prev => ({
      ...prev,
      [subjectName]: prev[subjectName].filter((_, i) => i !== idx),
    }));
  };

  const findCurrentGrade = (
    subjectName: string,
    gradeId: number
  ): Grade | null => {
    if (!data?.subjectsMap) return null;
    for (const subject of Object.values(data.subjectsMap)) {
      if (subject.name.full !== subjectName) continue;
      const groups = subject.grades?.subjectPartsGrades;
      if (!groups) continue;
      for (const grades of Object.values(groups)) {
        const found = grades.find(g => g.gradeId === gradeId);
        if (found) return found;
      }
    }
    return null;
  };

  const scrollToBlock = (key: string) => {
    setTimeout(() => {
      const y = blockLayoutY.current[key];
      if (y !== undefined && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: Math.max(y - 12, 0),
          animated: true,
        });
      }
    }, 350);

    setHighlightedBlock(key);
    setTimeout(() => {
      setHighlightedBlock(prev => (prev === key ? null : prev));
    }, 2500);
  };

  const handleIncomingChange = (change: Change) => {
    switch (change.type) {
      case 'GradeAddition':
      case 'GradeWeightChange':
      case 'GradeValueChange': {
        const subjectName = change.subjectName.full;
        const currentGrade =
          findCurrentGrade(subjectName, change.newGrade.gradeId) ??
          change.newGrade;
        setModal({ grade: currentGrade, subjectName });
        scrollToBlock(subjectName);
        break;
      }
      case 'GradeDeletion': {
        const subjectName = change.subjectName.full;
        // The grade no longer exists in fresh data, so show it straight
        // from the change payload.
        setModal({ grade: change.oldGrade, subjectName });
        scrollToBlock(subjectName);
        break;
      }
      case 'FinalGradeChange': {
        // No modal for final grades — just scroll to & highlight the subject.
        scrollToBlock(change.subjectName.full);
        break;
      }
      case 'BehaviourFinalGradeChange': {
        scrollToBlock(BEHAVIOUR_LAYOUT_KEY);
        break;
      }
      case 'BehaviourNotificationAdded': {
        setNotificationDetail(change.newNotification.recordId);
        scrollToBlock(BEHAVIOUR_LAYOUT_KEY);
        break;
      }
    }
  };

  useEffect(() => {
    if (!handleGradeChange || !data) {
      return;
    }
    if (processedChangeRef.current === handleGradeChange) {
      return;
    }
    processedChangeRef.current = handleGradeChange;

    try {
      const change: Change = JSON.parse(handleGradeChange);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleIncomingChange(change);
    } catch (e) {
      console.warn('Failed to parse handleGradeChange param', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGradeChange, data]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 56 }}
        contentContainerStyle={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 12,
          paddingTop: 12,
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <YearSelector
          selected={selectedYear}
          handleSelectYear={y => setSelectedYear(y)}
        />

        <HalfSelector
          selected={data?.selectedSchoolYearHalf || selectedHalf}
          handleSelectHalf={h => setSelectedHalf(h)}
        />

        <Button
          mode={plannerMode ? 'contained' : 'outlined'}
          onPress={() => setPlannerMode(!plannerMode)}
        >
          {plannerMode ? 'Plánovač: Zapnuto' : 'Plánovač: Vypnuto'}
        </Button>
      </ScrollView>

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={['#fff']}
            progressBackgroundColor={'#23272e'}
          />
        }
      >
        {error && (
          <Text style={{ color: 'red', marginTop: 24 }}>{String(error)}</Text>
        )}

        {data?.subjectsMap &&
          Object.entries(data.subjectsMap).map(([subjectKey, subject]) => {
            const subjectNameStr = subject.name.full;
            const plannedAvg = getPlannedAverage(subject);
            const allGrades = getSubjectRealGrades(subject);
            const avg = getWeightedAverage(allGrades);
            const isHighlighted = highlightedBlock === subjectNameStr;

            return (
              <View
                key={subjectKey}
                onLayout={e => {
                  blockLayoutY.current[subjectNameStr] = e.nativeEvent.layout.y;
                }}
                style={[
                  styles.subjectBlock,
                  { backgroundColor: theme.colors.surfaceVariant },
                  isHighlighted && styles.subjectBlockHighlighted,
                ]}
              >
                <View style={styles.subjectHeader}>
                  <Text
                    variant="titleMedium"
                    style={[
                      styles.subjectName,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {subjectNameStr}
                  </Text>

                  {subject.finalGrade && (
                    <Chip
                      style={styles.finalGradeChip}
                      textStyle={styles.finalGradeChipText}
                    >
                      {formatFinalGrade(subject.finalGrade)}
                    </Chip>
                  )}

                  {plannerMode && (
                    <Button
                      mode="text"
                      onPress={() => {
                        setAddingFor(subjectNameStr);
                        setShowAddModal(true);
                      }}
                      style={{ marginLeft: 8 }}
                      compact
                    >
                      <MaterialIcons
                        name="add"
                        size={22}
                        color={theme.colors.onSurface}
                      />
                    </Button>
                  )}
                </View>

                {avg !== null && (
                  <View style={styles.avgPill}>
                    <Text style={styles.avgPillText}>
                      Průměr: {avg.toFixed(2)}
                    </Text>
                    {plannerMode &&
                      plannedAvg !== null &&
                      plannedAvg !== avg && (
                        <Text
                          style={[
                            styles.avgPillText,
                            { marginLeft: 12, color: '#90ee90' },
                          ]}
                        >
                          Nový: {plannedAvg.toFixed(2)}
                        </Text>
                      )}
                  </View>
                )}

                {/* Hypothetical Planner Chips */}
                {plannerMode && hypotheticals[subjectNameStr]?.length > 0 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      marginBottom: 8,
                    }}
                  >
                    {hypotheticals[subjectNameStr].map((g, i) => (
                      <Chip
                        key={i}
                        style={{
                          marginRight: 6,
                          marginBottom: 6,
                          backgroundColor: '#23272e',
                        }}
                        onClose={() =>
                          handleRemoveHypothetical(subjectNameStr, i)
                        }
                      >
                        {g.value} ({g.small ? 'Malá' : 'Normální'})
                      </Chip>
                    ))}
                  </View>
                )}

                {subject.grades.subjectPartsGrades &&
                  Object.entries(subject.grades.subjectPartsGrades).map(
                    ([partName, grades]) => (
                      <View key={partName} style={{ marginBottom: 8 }}>
                        {partName !== 'null' && (
                          <Text
                            style={{
                              color: '#aaa',
                              marginBottom: 2,
                              fontSize: 15,
                            }}
                          >
                            {partName}:
                          </Text>
                        )}

                        {grades.length > 0 && (
                          <View style={styles.gradesRowContainer}>
                            <View style={styles.gradesRow}>
                              {grades.map(grade => (
                                <GradeSquare
                                  grade={grade}
                                  key={grade.gradeId}
                                  onPress={() =>
                                    setModal({
                                      grade,
                                      subjectName: subjectNameStr,
                                    })
                                  }
                                />
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    )
                  )}

                {/* Hypothetical Addition Modal */}
                <Portal>
                  <PaperModal
                    visible={showAddModal && addingFor === subjectNameStr}
                    onDismiss={() => {
                      setShowAddModal(false);
                      setAddingFor(null);
                    }}
                    contentContainerStyle={[
                      styles.paperModalContent,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                  >
                    <Text variant="titleLarge" style={{ marginBottom: 8 }}>
                      Přidat hypotetickou známku
                    </Text>

                    <Text style={{ marginBottom: 8 }}>Známka:</Text>
                    <View style={styles.modalButtonRow}>
                      {[1, 2, 3, 4, 5].map(v => (
                        <Button
                          key={v}
                          mode={newGradeValue === v ? 'contained' : 'outlined'}
                          onPress={() => setNewGradeValue(v)}
                          style={[
                            styles.modalButtonBase,
                            newGradeValue === v
                              ? styles.modalButtonSelected
                              : styles.modalButtonUnselected,
                          ]}
                          labelStyle={styles.modalButtonLabel}
                        >
                          {v}
                        </Button>
                      ))}
                    </View>

                    <Text style={{ marginBottom: 8 }}>Váha:</Text>
                    <View style={styles.modalButtonRow}>
                      {[false, true].map(small => (
                        <Button
                          key={small ? 'small' : 'normal'}
                          mode={
                            newGradeSmall === small ? 'contained' : 'outlined'
                          }
                          onPress={() => setNewGradeSmall(small)}
                          style={[
                            { ...styles.modalButtonBase, minWidth: 80 },
                            newGradeSmall === small
                              ? styles.modalButtonSelected
                              : styles.modalButtonUnselected,
                          ]}
                          labelStyle={styles.modalButtonLabel}
                        >
                          {small ? 'Malá' : 'Normální'}
                        </Button>
                      ))}
                    </View>

                    <View style={styles.modalActionRow}>
                      <Button
                        mode="contained"
                        onPress={() => handleAddHypothetical(subjectNameStr)}
                        style={{ marginRight: 8 }}
                      >
                        Přidat
                      </Button>
                      <Button
                        mode="text"
                        onPress={() => {
                          setShowAddModal(false);
                          setAddingFor(null);
                        }}
                      >
                        Zrušit
                      </Button>
                    </View>
                  </PaperModal>
                </Portal>
              </View>
            );
          })}

        {data?.behaviour && data.behaviour.notifications.length > 0 && (
          <View
            onLayout={e => {
              blockLayoutY.current[BEHAVIOUR_LAYOUT_KEY] =
                e.nativeEvent.layout.y;
            }}
            style={[
              styles.subjectBlock,
              { backgroundColor: theme.colors.surfaceVariant },
              highlightedBlock === BEHAVIOUR_LAYOUT_KEY &&
                styles.subjectBlockHighlighted,
            ]}
          >
            <View style={styles.subjectHeader}>
              <Text
                variant="titleMedium"
                style={[styles.subjectName, { color: theme.colors.onSurface }]}
              >
                Chování
              </Text>
            </View>
            <View style={styles.gradesRow}>
              {data.behaviour.notifications.map(notif => (
                <Chip
                  key={notif.recordId}
                  style={{
                    marginRight: 6,
                    marginBottom: 6,
                    backgroundColor:
                      notif.type === 'BAD'
                        ? '#b50b0b'
                        : notif.type === 'GOOD'
                          ? '#4CAF50'
                          : '#3498db',
                  }}
                  textStyle={{ color: '#fff', fontWeight: 'bold' }}
                  onPress={() => {
                    setNotificationDetail(notif.recordId);
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Ionicons
                      name={
                        notif.type === 'GOOD'
                          ? 'star'
                          : notif.type === 'BAD'
                            ? 'close-outline'
                            : 'information-circle'
                      }
                      size={14}
                      color="#fff"
                    />
                    <Text style={{ color: '#fff' }}>{notif.message}</Text>
                  </View>
                </Chip>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Grade Info Detail Modal */}
      <GradeDetailModal
        visible={!!modal}
        onClose={() => setModal(null)}
        grade={modal?.grade || null}
        subjectName={modal?.subjectName || ''}
      />

      <NotificationDetailModal
        notificationId={notificationDetail}
        onClose={() => setNotificationDetail(undefined)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  scrollContent: {
    padding: 12, // Matched RozvrhScreen spacing
    alignItems: 'stretch',
    minHeight: Dimensions.get('window').height - 100,
  },
  subjectBlock: {
    marginBottom: 24,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  subjectBlockHighlighted: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subjectName: {
    fontWeight: 'bold',
    fontSize: 18,
    flex: 1,
  },
  finalGradeChip: {
    marginLeft: 12,
    borderRadius: 8,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    elevation: 0,
    backgroundColor: '#23272e',
  },
  finalGradeChipText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  avgPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#23272e',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 8,
    marginTop: 2,
    flexDirection: 'row',
  },
  avgPillText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  divider: {
    marginVertical: 8,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gradesRowContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 8,
  },
  gradesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    alignItems: 'center',
  },
  gradeSquare: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 2,
    marginBottom: 2,
  },
  gradeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  paperModalContent: {
    borderRadius: 16,
    padding: 24,
    minWidth: 260,
    maxWidth: 340,
    alignSelf: 'center',
    alignItems: 'flex-start',
  },
  modalButtonBase: {
    minWidth: 36,
    height: 32,
    marginRight: 2,
    marginBottom: 4,
    paddingHorizontal: 0,
  },
  modalButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    height: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonUnselected: {
    borderColor: '#fff',
    borderWidth: 1,
    backgroundColor: 'transparent',
    height: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold' as const,
    textAlign: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginBottom: 12,
    gap: 4,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
});
