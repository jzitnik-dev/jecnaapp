import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Divider, Modal as PaperModal, Portal, Text, useTheme } from 'react-native-paper';
import type { Grade as GradeBase, PochvalaDetail, SubjectGrades } from '../../api/SpseJecnaClient';
import { useSpseJecnaClient } from '../../hooks/useSpseJecnaClient';

type Grade = GradeBase & { href?: string };

const gradeColor = (value: number | 'N') => {
  if (value === 'N') return 'rgb(189,189,189)'; // gray
  const colors = [
    [76, 175, 80],   // 1: #4CAF50
    [139, 195, 74], // 2: #8BC34A
    [255, 193, 7],  // 3: #FFC107
    [255, 152, 0],  // 4: #FF9800
    [244, 67, 54],  // 5: #F44336
  ];
  const idx = Math.round(value as number) - 1;
  const c = colors[idx] || [189, 189, 189];
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

const GradeSquare = ({ grade, subject, onPress }: { grade: Grade; subject: string; onPress: () => void }) => {
  if (grade.value === 'Pochvala') return null;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.gradeSquare,
      {
        backgroundColor: gradeColor(grade.value as number | 'N'),
        opacity: 1,
        width: 44,
        height: grade.weight === 0.5 ? 22 : 44,
      },
    ]}>
      <Text style={[
        styles.gradeText,
        grade.value === 'N' ? { color: '#333', fontSize: 16 } : (grade.weight === 0.5 ? { fontSize: 14 } : {}),
      ]}>{String(grade.value)}</Text>
    </Pressable>
  );
};

function GradeDetailModal({ visible, onClose, grade, subject }: {
  visible: boolean;
  onClose: () => void;
  grade: Grade | null;
  subject: string;
}) {
  const theme = useTheme();
  if (!grade) return null;
  return (
    <Portal>
      <PaperModal visible={visible} onDismiss={onClose} contentContainerStyle={[styles.paperModalContent, { backgroundColor: theme.colors.surfaceVariant }]}
        theme={theme}
      >
        <Text variant="titleLarge" style={{ marginBottom: 8 }}>{subject}</Text>
        <Text>Známka: <Text style={{ fontWeight: 'bold' }}>{grade.value}</Text></Text>
        <Text>Typ: <Text style={{ fontWeight: 'bold' }}>{grade.weight === 0.5 ? 'Malá' : 'Normální'}</Text></Text>
        {grade.date && <Text>Datum: <Text style={{ fontWeight: 'bold' }}>{grade.date}</Text></Text>}
        {grade.teacher && <Text>Učitel: <Text style={{ fontWeight: 'bold' }}>{grade.teacher}</Text></Text>}
        {grade.note && <Text>Poznámka: <Text style={{ fontWeight: 'bold' }}>{grade.note}</Text></Text>}
        <Button mode="contained" onPress={onClose} style={{ marginTop: 16 }}>Zavřít</Button>
      </PaperModal>
    </Portal>
  );
}

function getWeightedAverage(grades: Grade[]): number | null {
  const filtered = grades.filter(g => typeof g.value === 'number' && g.value >= 1 && g.value <= 5);
  if (filtered.length === 0) return null;
  let sum = 0;
  let weightSum = 0;
  for (const g of filtered) {
    sum += (typeof g.value === 'number' ? g.value : 0) * (g.weight || 1);
    weightSum += g.weight || 1;
  }
  if (weightSum === 0) return null;
  return sum / weightSum;
}

export default function ZnamkyScreen() {
  const { client } = useSpseJecnaClient();
  const { data, error, isLoading, refetch } = useQuery<SubjectGrades[]>({
    queryKey: ['znamky'],
    queryFn: async () => {
      if (!client) throw new Error('Not logged in');
      return client.getZnamky();
    },
    enabled: !!client,
  });
  const [modal, setModal] = useState<{ grade: Grade; subject: string } | null>(null);
  const [pochvalaModal, setPochvalaModal] = useState<{ href: string; label: string } | null>(null);
  const [pochvalaDetail, setPochvalaDetail] = useState<PochvalaDetail | null>(null);
  const [pochvalaLoading, setPochvalaLoading] = useState(false);
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [plannerMode, setPlannerMode] = useState(false);
  const [hypotheticals, setHypotheticals] = useState<{ [subject: string]: { value: number; weight: number }[] }>({});
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newGradeValue, setNewGradeValue] = useState<number>(1);
  const [newGradeWeight, setNewGradeWeight] = useState<number>(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Helper to get subject grades by name
  const getSubjectGrades = (subjectName: string) => {
    if (!data) return [];
    const subj = data.find(s => s.subject === subjectName);
    if (!subj || !Array.isArray(subj.splits)) return [];
    return subj.splits.flatMap(split => split.grades);
  };

  // Calculate new average with hypotheticals
  const getPlannedAverage = (subject: string) => {
    const realGrades = getSubjectGrades(subject);
    const hypotheticalsForSubject = hypotheticals[subject] || [];
    const hypotheticalsGrades: Grade[] = hypotheticalsForSubject.map(g => ({ value: g.value, weight: g.weight } as Grade));
    return getWeightedAverage([...realGrades, ...hypotheticalsGrades]);
  };

  const handleAddHypothetical = (subject: string) => {
    setHypotheticals(prev => ({
      ...prev,
      [subject]: [...(prev[subject] || []), { value: newGradeValue, weight: newGradeWeight }],
    }));
    setShowAddModal(false);
    setAddingFor(null);
    setNewGradeValue(1);
    setNewGradeWeight(1);
  };

  const handleRemoveHypothetical = (subject: string, idx: number) => {
    setHypotheticals(prev => ({
      ...prev,
      [subject]: prev[subject].filter((_, i) => i !== idx),
    }));
  };

  if (!client) {
    return (
      <View style={styles.centered}>
        <Text variant="headlineMedium">Známky</Text>
        <Text style={{ marginTop: 24 }}>Přihlaste se prosím.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            colors={['#fff']}
            progressBackgroundColor={'#23272e'}
          />
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Button
            mode={plannerMode ? 'contained' : 'outlined'}
            onPress={() => setPlannerMode(!plannerMode)}
            style={{ marginRight: 12 }}
          >
            {plannerMode ? 'Plánovač známek: Zapnuto' : 'Plánovač známek: Vypnuto'}
          </Button>
        </View>
        {isLoading && <ActivityIndicator style={{ marginTop: 24 }} />}
        {error && <Text style={{ color: 'red', marginTop: 24 }}>{String(error)}</Text>}
        {data && Array.isArray(data) && data.every(subject => Array.isArray(subject.splits) && subject.splits.every(split => split.grades.length === 0)) && (
          <Text style={{ marginTop: 24 }}>Žádné známky nenalezeny.</Text>
        )}
        {data && Array.isArray(data) && data.some(subject => Array.isArray(subject.splits) && subject.splits.some(split => split.grades.length > 0)) && data.map((subject, idx) => {
          const plannedAvg = getPlannedAverage(subject.subject);
          const allGrades = subject.splits.flatMap(split => split.grades);
          const avg = getWeightedAverage(allGrades);
          return (
            <View key={subject.subject + idx} style={[styles.subjectBlock, { backgroundColor: '#181a20' }]}> 
              <View style={styles.subjectHeader}>
                <Text variant="titleMedium" style={styles.subjectName}>{subject.subject}</Text>
                {subject.finalGrade && (
                  <Chip style={styles.finalGradeChip} textStyle={styles.finalGradeChipText}>
                    {subject.finalGrade}
                  </Chip>
                )}
                {plannerMode && (
                  <Button
                    mode="text"
                    onPress={() => { setAddingFor(subject.subject); setShowAddModal(true); }}
                    style={{ marginLeft: 8 }}
                    compact
                  >
                    <MaterialIcons name="add" size={22} color="#fff" />
                  </Button>
                )}
              </View>
              {avg !== null && (
                <View style={styles.avgPill}>
                  <Text style={styles.avgPillText}>Průměr: {avg.toFixed(2)}</Text>
                  {plannerMode && plannedAvg !== null && plannedAvg !== avg && (
                    <Text style={[styles.avgPillText, { marginLeft: 12, color: '#90ee90' }]}>Nový: {plannedAvg.toFixed(2)}</Text>
                  )}
                </View>
              )}
              {plannerMode && (hypotheticals[subject.subject]?.length > 0) && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                  {hypotheticals[subject.subject].map((g, i) => (
                    <Chip
                      key={i}
                      style={{ marginRight: 6, marginBottom: 6, backgroundColor: '#23272e' }}
                      onClose={() => handleRemoveHypothetical(subject.subject, i)}
                    >
                      {g.value} ({g.weight === 1 ? 'Normální' : 'Malá'})
                    </Chip>
                  ))}
                </View>
              )}
              {subject.splits.map((split, splitIdx) => (
                <View key={split.label + splitIdx} style={{ marginBottom: 8 }}>
                  {!(subject.splits.length === 1 && (!split.label || split.label === 'Bez rozdělení')) && (
                    <Text style={{ color: '#aaa', marginBottom: 2, fontSize: 15 }}>{split.label}:</Text>
                  )}
                  <View style={styles.gradesRowContainer}>
                    <View style={styles.gradesRow}>
                      {split.grades.map((grade, i) => (
                        subject.subject === 'Chování' && grade.value === 'Pochvala' ? (
                          <Chip
                            key={i}
                            style={{ marginRight: 6, marginBottom: 6, backgroundColor: '#4CAF50' }}
                            textStyle={{ color: '#fff', fontWeight: 'bold' }}
                            icon="star"
                            onPress={async () => {
                              const href = (grade as any).href;
                              if (!href || !client) return;
                              setPochvalaModal({ href, label: grade.note || 'Pochvala' });
                              setPochvalaDetail(null);
                              setPochvalaLoading(true);
                              try {
                                const detail = await client.getPochvalaDetail(href);
                                setPochvalaDetail(detail);
                              } catch (e) {
                                setPochvalaDetail({ type: '', date: '', message: 'Chyba při načítání detailu.' });
                              }
                              setPochvalaLoading(false);
                            }}
                          >
                            {grade.note || 'Pochvala'}
                          </Chip>
                        ) : (
                          <GradeSquare grade={grade} subject={subject.subject} key={i} onPress={() => setModal({ grade, subject: subject.subject })} />
                        )
                      ))}
                    </View>
                  </View>
                </View>
              ))}
              <Portal>
                <PaperModal
                  visible={showAddModal && addingFor === subject.subject}
                  onDismiss={() => { setShowAddModal(false); setAddingFor(null); }}
                  contentContainerStyle={[styles.paperModalContent, { backgroundColor: theme.colors.surfaceVariant }]}
                >
                  <Text variant="titleLarge" style={{ marginBottom: 8 }}>Přidat hypotetickou známku</Text>
                  <Text style={{ marginBottom: 8 }}>Známka:</Text>
                  <View style={styles.modalButtonRow}>
                    {[1, 2, 3, 4, 5].map(v => (
                      <Button
                        key={v}
                        mode={newGradeValue === v ? 'contained' : 'outlined'}
                        onPress={() => setNewGradeValue(v)}
                        style={[
                          { minWidth: 36, height: 32, marginRight: 2, marginBottom: 4, paddingHorizontal: 0 },
                          newGradeValue === v ? styles.modalButtonSelected : styles.modalButtonUnselected,
                        ]}
                        labelStyle={styles.modalButtonLabel}
                      >
                        {v}
                      </Button>
                    ))}
                  </View>
                  <Text style={{ marginBottom: 8 }}>Váha:</Text>
                  <View style={styles.modalButtonRow}>
                    {[1, 0.5].map(w => (
                      <Button
                        key={w}
                        mode={newGradeWeight === w ? 'contained' : 'outlined'}
                        onPress={() => setNewGradeWeight(w)}
                        style={[
                          { minWidth: 60, height: 32, marginRight: 2, marginBottom: 4, paddingHorizontal: 0 },
                          newGradeWeight === w ? styles.modalButtonSelected : styles.modalButtonUnselected,
                        ]}
                        labelStyle={styles.modalButtonLabel}
                      >
                        {w === 1 ? 'Normální' : 'Malá'}
                      </Button>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%' }}>
                    <Button mode="contained" onPress={() => handleAddHypothetical(subject.subject)} style={{ marginRight: 8 }}>Přidat</Button>
                    <Button mode="text" onPress={() => { setShowAddModal(false); setAddingFor(null); }}>Zrušit</Button>
                  </View>
                </PaperModal>
              </Portal>
              <Divider style={styles.divider} />
            </View>
          );
        })}
      </ScrollView>
      <GradeDetailModal
        visible={!!modal}
        onClose={() => setModal(null)}
        grade={modal?.grade || null}
        subject={modal?.subject || ''}
      />
      {/* Pochvala detail modal */}
      <Portal>
        <PaperModal
          visible={!!pochvalaModal}
          onDismiss={() => { setPochvalaModal(null); setPochvalaDetail(null); }}
          contentContainerStyle={[styles.paperModalContent, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          <Text variant="titleLarge" style={{ marginBottom: 8 }}>{pochvalaModal?.label || 'Pochvala'}</Text>
          {pochvalaLoading && <ActivityIndicator style={{ marginVertical: 16 }} />}
          {pochvalaDetail && (
            <>
              <Text>Typ: <Text style={{ fontWeight: 'bold' }}>{pochvalaDetail.type}</Text></Text>
              <Text>Datum: <Text style={{ fontWeight: 'bold' }}>{pochvalaDetail.date}</Text></Text>
              <Text>Sdělení: <Text style={{ fontWeight: 'bold' }}>{pochvalaDetail.message}</Text></Text>
            </>
          )}
          <Button mode="contained" onPress={() => setPochvalaModal(null)} style={{ marginTop: 16 }}>Zavřít</Button>
        </PaperModal>
      </Portal>
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
    padding: 16,
    alignItems: 'stretch',
    minHeight: Dimensions.get('window').height - 100,
  },
  subjectBlock: {
    marginBottom: 24,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
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
    color: '#fff',
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
  },
  avgPillText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  avgText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
    marginTop: 2,
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
});
