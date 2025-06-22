import { useSpseJecnaClient } from '@/hooks/useSpseJecnaClient';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Divider, Surface, Text, useTheme } from 'react-native-paper';
import { TimetableGrid } from '../../../components/TimetableGrid';

export default function UcebnaScreen() {
  const { code } = useLocalSearchParams();
  const { client } = useSpseJecnaClient();
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    setError(null);
    setData(null);
    client
      .getUcebnaParsed(String(code))
      .then((parsed: any) => {
        setData(parsed);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError('Chyba při načítání dat.');
        setLoading(false);
      });
  }, [code, client]);

  useEffect(() => {
    if (navigation?.setOptions) {
      if (loading) {
        navigation.setOptions({ title: 'Učebna' });
      } else if (data && data.title) {
        navigation.setOptions({ title: data.title });
      }
    }
  }, [loading, data, navigation]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Načítám učebnu…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }
  if (!data) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 0 }}
    >
      <Surface
        style={[
          styles.hero,
          {
            backgroundColor: theme.colors.surfaceVariant,
            marginHorizontal: 16,
          },
        ]}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 24,
            paddingHorizontal: 24,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              variant="headlineLarge"
              style={[
                styles.name,
                {
                  color: theme.colors.onSurface,
                  fontWeight: 'bold',
                  marginTop: 0,
                },
              ]}
            >
              {data.title}
            </Text>
            {data.mainClassroom ? (
              <Text
                style={[
                  styles.code,
                  { color: theme.colors.primary, marginBottom: 12 },
                ]}
              >
                {data.mainClassroom}
              </Text>
            ) : null}
          </View>
        </View>
        <Divider
          style={{
            marginVertical: 10,
            backgroundColor: theme.colors.outline,
            opacity: 0.2,
          }}
        />
        <View style={{ marginTop: 8, paddingHorizontal: 24, marginBottom: 18 }}>
          {data.floor && (
            <View style={[styles.infoRow, { marginBottom: 6 }]}>
              <Text style={styles.infoLabel}>Podlaží:</Text>
              <Text style={styles.infoValue} selectable={true}>
                {data.floor}
              </Text>
            </View>
          )}
          {data.manager && (
            <View style={[styles.infoRow, { marginBottom: 6 }]}>
              <Text style={styles.infoLabel}>Správce:</Text>
              {data.managerHref ? (
                <Text
                  style={[styles.infoValue, styles.link]}
                  onPress={() =>
                    router.push(
                      data.managerHref.replace('/ucitel/', '/teachers/')
                    )
                  }
                >
                  {data.manager}
                </Text>
              ) : (
                <Text style={styles.infoValue} selectable={true}>
                  {data.manager}
                </Text>
              )}
            </View>
          )}
        </View>
      </Surface>
      <Text
        variant="titleLarge"
        style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
      >
        Rozvrh učebny
      </Text>
      <View
        style={[
          styles.sectionSurface,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        {data.timetable &&
        data.timetable.periods &&
        data.timetable.days &&
        data.timetable.days.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TimetableGrid
              periods={data.timetable.periods}
              days={data.timetable.days}
              onTeacherPress={teacherCode =>
                router.push(`/teachers/${teacherCode}`)
              }
              onRoomPress={roomCode => router.push(`/ucebna/${roomCode}`)}
            />
          </ScrollView>
        ) : (
          <Text
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
          >
            Rozvrh není k dispozici.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  hero: {
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 12,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: 2,
  },
  code: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
  },
  link: {
    color: '#2196f3',
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    marginLeft: 24,
    marginTop: 12,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  sectionSurface: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});
