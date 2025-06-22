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

export default function RoomsListScreen() {
  const { client } = useSpseJecnaClient();
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<{ label: string; code: string }[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    setError(null);
    client
      .getRoomsList()
      .then(list => {
        setRooms(list);
        setLoading(false);
      })
      .catch(() => {
        setError('Chyba při načítání učeben.');
        setLoading(false);
      });
  }, [client]);

  const filtered = rooms.filter(
    r =>
      r.label.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Searchbar
        placeholder="Hledat učebnu..."
        value={search}
        onChangeText={setSearch}
        style={{ margin: 16, marginBottom: 0, borderRadius: 16 }}
        inputStyle={{ fontSize: 18 }}
      />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text>Načítám učebny…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: 'red' }}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
          {filtered.length === 0 ? (
            <Text
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginTop: 32,
              }}
            >
              Žádná učebna nenalezena.
            </Text>
          ) : (
            filtered.map((r, i) => (
              <Surface
                key={r.code}
                style={[
                  styles.roomCard,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
                onTouchEnd={() => router.push(`/ucebna/${r.code}`)}
              >
                <Text
                  style={[styles.roomLabel, { color: theme.colors.onSurface }]}
                >
                  {r.label}
                </Text>
                <Text
                  style={[styles.roomCode, { color: theme.colors.primary }]}
                >
                  {r.code}
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
  roomCard: {
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
  roomLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  roomCode: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
});
