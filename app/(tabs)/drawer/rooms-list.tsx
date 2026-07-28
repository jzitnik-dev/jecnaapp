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
import { JecnaAPI } from 'jecnaapi-react-native';

export default function RoomsListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const roomsQuery = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      return JecnaAPI.getRoomsPage();
    },
  });

  const filtered = roomsQuery.data?.roomReferences.filter(
    r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.roomCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Searchbar
        placeholder="Hledat učebnu..."
        value={search}
        onChangeText={setSearch}
        style={{ margin: 16, marginBottom: 8, borderRadius: 16 }}
        inputStyle={{ fontSize: 18 }}
      />
      {roomsQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.onBackground} />
          <Text style={{ color: theme.colors.onBackground }}>
            Načítám učebny…
          </Text>
        </View>
      ) : roomsQuery.error ? (
        <View style={styles.centered}>
          <Text style={{ color: 'red' }}>
            {roomsQuery.error.message || 'Chyba při načítání učeben.'}
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
              Žádná učebna nenalezena.
            </Text>
          ) : (
            filtered?.map(r => (
              <Surface
                key={r.roomCode}
                style={[
                  styles.roomCard,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
                onTouchEnd={() => router.push(`/ucebna/${r.roomCode}`)}
              >
                <Text
                  style={[styles.roomLabel, { color: theme.colors.onSurface }]}
                >
                  {r.name}
                </Text>
                {r.roomCode.length < 5 && (
                  <Text
                    style={[styles.roomCode, { color: theme.colors.primary }]}
                  >
                    {r.roomCode}
                  </Text>
                )}
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
