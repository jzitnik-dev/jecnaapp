import {
  useLocalSearchParams,
  useNavigation,
  useRouter,
  type Href,
} from 'expo-router';
import { useEffect } from 'react';
import {
  Pressable,
  RefreshControl,
  Text as RNText,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ActivityIndicator, Divider, Text, useTheme } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';

import { TeacherImageViewer } from '@/components/TeacherImageViewer';
import { TimetableGrid } from '@/components/TimetableGrid';
import { useLayoutPaths } from '@/lib/layoutPaths';
import { Teacher } from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { JecnaAPI } from '@jzitnik/jecnaapi-react-native';

export default function TeacherScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const paths = useLayoutPaths();
  const teacher = params.teacher;
  const routeName = params.name;
  const theme = useTheme();

  const {
    data: info,
    isLoading,
    isError,
    isFetching,
    error,
    refetch,
  } = useQuery<Teacher, Error>({
    queryKey: ['teacherProfile', teacher],
    queryFn: async () => {
      if (typeof teacher !== 'string') {
        throw new Error('Unreachable hopefully');
      }
      return await JecnaAPI.getTeacher(teacher);
    },
    enabled: typeof teacher === 'string',
    staleTime: 15 * 60 * 1000,
  });

  useEffect(() => {
    if (isLoading && navigation?.setOptions) {
      navigation.setOptions({ title: 'Učitel' });
    } else if (info?.fullName && navigation?.setOptions) {
      navigation.setOptions({ title: info.fullName });
    }
  }, [info, isLoading, navigation]);

  if (typeof teacher !== 'string') {
    return (
      <View style={styles.centered}>
        <Text style={{ color: theme.colors.error }}>
          Chyba: Parametr učitele není předán nebo není string.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16 }}>Načítám učitele…</Text>
      </View>
    );
  }

  // 3. Error state
  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: theme.colors.error }}>
          {error?.message || 'Chyba při načítání profilu.'}
        </Text>
      </View>
    );
  }

  if (!info) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 0 }}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={refetch} />
      }
    >
      <View
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
          <View style={styles.photoShadow}>
            <TeacherImageViewer imageUrl={info.profilePicturePath} />
          </View>
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
              {routeName || info.fullName}
            </Text>
            <Text
              style={[
                styles.code,
                { color: theme.colors.primary, marginBottom: 12 },
              ]}
            >
              {info.tag}
              {info.username ? ` • ${info.username}` : ''}
            </Text>
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
          <View style={[styles.infoRow, { marginBottom: 6 }]}>
            <Text style={styles.infoLabel}>Kabinet:</Text>
            <Pressable
              onPress={() => {
                router.push(paths.room(info.cabinet?.roomCode ?? '') as Href);
              }}
            >
              <RNText
                style={[
                  styles.infoValue,
                  { color: '#2196f3', textDecorationLine: 'underline' },
                ]}
              >
                {info.cabinet?.name}
              </RNText>
            </Pressable>
          </View>
          {info.consultationHours && (
            <View style={[styles.infoRow, { marginBottom: 6 }]}>
              <Text style={styles.infoLabel}>Konzultační hodiny:</Text>
              <Text
                style={[styles.infoValue, { color: theme.colors.onSurface }]}
                selectable={true}
              >
                {info.consultationHours}
              </Text>
            </View>
          )}
          {info.schoolMail && (
            <View style={[styles.infoRow, { marginBottom: 6 }]}>
              <Text style={styles.infoLabel}>E-mail:</Text>
              <Text
                style={[styles.infoValue, { color: theme.colors.onSurface }]}
                selectable={true}
              >
                {info.schoolMail}
              </Text>
            </View>
          )}
          {info.privateMail && (
            <View style={[styles.infoRow, { marginBottom: 6 }]}>
              <Text style={styles.infoLabel}>Soukromý e-mail:</Text>
              <Text
                style={[styles.infoValue, { color: theme.colors.onSurface }]}
                selectable={true}
              >
                {info.privateMail}
              </Text>
            </View>
          )}
          {info.phoneNumbers && (
            <View style={[styles.infoRow, { marginBottom: 6 }]}>
              <Text style={styles.infoLabel}>Telefon:</Text>
              <Text
                style={[styles.infoValue, { color: theme.colors.onSurface }]}
                selectable={true}
              >
                {info.phoneNumbers.join(', ')}
              </Text>
            </View>
          )}
          {info.privatePhoneNumber && (
            <View style={[styles.infoRow, { marginBottom: 6 }]}>
              <Text style={styles.infoLabel}>Soukromý telefon:</Text>
              <Text
                style={[styles.infoValue, { color: theme.colors.onSurface }]}
                selectable={true}
              >
                {info.privatePhoneNumber}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text
        variant="titleLarge"
        style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
      >
        Rozvrh hodin
      </Text>
      <View
        style={[
          styles.sectionSurface,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        {info.timetable ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TimetableGrid
              timetable={info.timetable}
              onRoomPress={room => router.push(paths.room(room) as Href)}
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
      <Text
        variant="titleLarge"
        style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
      >
        Certifikace a kurzy
      </Text>
      <View
        style={[
          styles.sectionSurface,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        {info.certificates && info.certificates.length > 0 ? (
          info.certificates.map((cert, i: number) => (
            <View key={i} style={styles.certRow}>
              <Text style={{ fontWeight: 'bold', marginRight: 8 }}>
                {cert.dateIssued
                  ? cert.dateIssued.toLocaleDateString('cs-CZ')
                  : '-'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold' }}>{cert.label}</Text>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  {cert.issuer}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Žádné certifikace.
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
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  photoShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginRight: 14,
  },
  heroText: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: 2,
  },
  code: {
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.7,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 120,
    color: '#aaa',
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    flex: 1,
    flexWrap: 'wrap',
    marginLeft: 14,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 24,
    fontWeight: 'bold',
    fontSize: 22,
  },
  sectionSurface: {
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 18,
    backgroundColor: 'rgba(30,30,40,0.85)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  link: { color: '#2196f3', textDecorationLine: 'underline' },
});
