import { useSpseJecnaClient } from '@/hooks/useSpseJecnaClient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Surface, Text, useTheme } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { Absence, ExtraordinaryTimetable } from '@/api/SpseJecnaClient';
import { Picker } from '@react-native-picker/picker';

export default function TeacherAbsencesScreen() {
  const { client } = useSpseJecnaClient();
  const theme = useTheme();
  const router = useRouter();
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  const teachersQuery = useQuery<ExtraordinaryTimetable, Error>({
    queryKey: ['extraordinarytimetable'],
    queryFn: async () => {
      if (!client) throw new Error('Client not available');
      return client.getExtraordinaryTimetable();
    },
    enabled: !!client,
  });

  const { absences } = useMemo(() => {
    return {
      absences: teachersQuery.data?.schedule[currentDayIndex].ABSENCE || [],
    };
  }, [teachersQuery.data, currentDayIndex]);

  function getText(absence: Absence) {
    if (absence.type === 'wholeDay') {
      return 'Celý den';
    }

    if (absence.type === 'range') {
      return `Od ${absence?.hours?.from}. hodiny do ${absence?.hours?.to}. hodiny.`;
    }

    if (absence.type === 'single') {
      return `${absence.hours} hodinu.`;
    }

    return absence.original;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {teachersQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text>Načítám učitele…</Text>
        </View>
      ) : teachersQuery.error ? (
        <View style={styles.centered}>
          <Text style={{ color: 'red' }}>
            {teachersQuery.error.message || 'Chyba při načítání učitelů.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 8,
              borderRadius: 12,
              padding: 8,
              backgroundColor: theme.colors.surface,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
              marginTop: 8,
            }}
          >
            <Picker
              selectedValue={currentDayIndex}
              onValueChange={value => setCurrentDayIndex(value)}
              style={{
                color: theme.colors.onSurface,
                backgroundColor: theme.colors.surface,
              }}
            >
              {teachersQuery.data?.props?.map((prop, i) => {
                const date = new Date(prop.date);
                let formattedDate = `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
                if (prop.priprava) {
                  formattedDate += ' (příprava)';
                }
                return <Picker.Item key={i} label={formattedDate} value={i} />;
              })}
            </Picker>
          </View>
          {!teachersQuery.data ? (
            <Text
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginTop: 32,
              }}
            >
              Nastala chyba při načítání
            </Text>
          ) : (
            absences?.map(t => (
              <Surface
                key={t.teacherCode || t.original}
                style={[
                  styles.teacherCard,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
                onTouchEnd={() => {
                  if (t.original) {
                    return;
                  }
                  router.push(`/teachers/${t.teacherCode}`);
                }}
              >
                <View>
                  {t.original ? null : (
                    <Text
                      style={[
                        styles.teacherName,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {t.teacher}
                    </Text>
                  )}
                  <Text>{getText(t)}</Text>
                </View>
                <Text
                  style={[
                    styles.teacherShortcut,
                    { color: theme.colors.primary },
                  ]}
                >
                  {t.teacherCode}
                </Text>
              </Surface>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  teacherCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teacherName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  teacherShortcut: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
});
