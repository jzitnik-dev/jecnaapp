import { useSpseJecnaClient } from '@/hooks/useSpseJecnaClient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Searchbar,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';

export default function TeachersListScreen() {
  const { client } = useSpseJecnaClient();
  const theme = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const teachersQuery = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      if (!client) throw new Error('Client not available');
      return client.getTeachersList();
    },
    enabled: !!client,
  });

  const filtered = teachersQuery.data?.teachersReferences.filter(
    t =>
      t.fullName.toLowerCase().includes(search.toLowerCase()) ||
      t.tag.toLowerCase().includes(search.toLowerCase())
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
          {filtered && filtered.length === 0 ? (
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
            filtered?.map(t => (
              <Surface
                key={t.tag}
                style={[
                  styles.teacherCard,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
                onTouchEnd={() => router.push(`/teachers/${t.tag}`)}
              >
                <Text
                  style={[
                    styles.teacherName,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {t.fullName}
                </Text>
                <Text
                  style={[
                    styles.teacherShortcut,
                    { color: theme.colors.primary },
                  ]}
                >
                  {t.tag}
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
