import { useSpseJecnaClient } from '@/hooks/useSpseJecnaClient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Searchbar,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';

export default function TeachersListScreen() {
  const { client } = useSpseJecnaClient();
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<
    { name: string; shortcut: string }[]
  >([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    setError(null);
    client
      .getTeachersList()
      .then(list => {
        setTeachers(list);
        setLoading(false);
      })
      .catch(() => {
        setError('Chyba při načítání učitelů.');
        setLoading(false);
      });
  }, [client]);

  const filtered = teachers.filter(
    t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.shortcut.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Searchbar
        placeholder="Hledat učitele..."
        value={search}
        onChangeText={setSearch}
        style={{ margin: 16, marginBottom: 8, borderRadius: 16 }}
        inputStyle={{ fontSize: 18 }}
      />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text>Načítám učitele…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: 'red' }}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
          {filtered.length === 0 ? (
            <Text
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginTop: 32,
              }}
            >
              Žádný učitel nenalezen.
            </Text>
          ) : (
            filtered.map((t, i) => (
              <Surface
                key={t.shortcut}
                style={[
                  styles.teacherCard,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
                onTouchEnd={() => router.push(`/teachers/${t.shortcut}`)}
              >
                <Text
                  style={[
                    styles.teacherName,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {t.name}
                </Text>
                <Text
                  style={[
                    styles.teacherShortcut,
                    { color: theme.colors.primary },
                  ]}
                >
                  {t.shortcut}
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
