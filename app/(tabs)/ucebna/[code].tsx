import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Room } from 'jecnaapi-react-native/jecnaapi';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Divider, Surface, Text, useTheme } from 'react-native-paper';
import { TimetableGrid } from '../../../components/TimetableGrid';
import { JecnaAPI } from 'jecnaapi-react-native';

export default function UcebnaScreen() {
  const { code } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();

  const { data, isLoading, error } = useQuery<Room>({
    queryKey: ['room', code],
    queryFn: async () => {
      return JecnaAPI.getRoom(String(code));
    },
    enabled: !!code,
  });

  useEffect(() => {
    if (navigation?.setOptions) {
      if (isLoading) {
        navigation.setOptions({ title: 'Učebna' });
      } else if (data && data.name) {
        navigation.setOptions({ title: data.name });
      }
    }
  }, [isLoading, data, navigation]);

  if (isLoading) {
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
        <Text style={{ color: 'red' }}>
          {error.message || 'Chyba při načítání dat.'}
        </Text>
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
              {data.name}
            </Text>
            {data.homeroomOf ? (
              <Text
                style={[
                  styles.code,
                  { color: theme.colors.primary, marginBottom: 12 },
                ]}
              >
                {data.homeroomOf}
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
              {data.manager.tag ? (
                <Text
                  style={[styles.infoValue, styles.link]}
                  onPress={() => router.push(`/teachers/${data.manager?.tag}`)}
                >
                  {data.manager.fullName}
                </Text>
              ) : (
                <Text style={styles.infoValue} selectable={true}>
                  {data.manager.fullName}
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
        {data.timetable ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TimetableGrid
              timetable={data.timetable}
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
