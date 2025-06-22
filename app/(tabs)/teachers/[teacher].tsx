import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  Text as RNText,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { ActivityIndicator, Divider, Text, useTheme } from 'react-native-paper';
import type {
  TimetableDay,
  TimetablePeriod,
} from '../../../api/SpseJecnaClient';
import { TeacherImageViewer } from '../../../components/TeacherImageViewer';
import { TimetableGrid } from '../../../components/TimetableGrid';
import { useSpseJecnaClient } from '../../../hooks/useSpseJecnaClient';

export default function TeacherScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const teacher = params.teacher;
  const routeName = params.name;
  const theme = useTheme();
  const { client } = useSpseJecnaClient();
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!client || typeof teacher !== 'string') {
      setError(
        'Chyba: Parametr učitele není předán nebo není string.\nVšechny parametry: ' +
          JSON.stringify(params)
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await client.getTeacherProfile(teacher);
      setInfo(data);
    } catch (e: any) {
      setError(e?.message || 'Chyba při načítání profilu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setInfo(null);
    fetchData().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [client, teacher]);

  useEffect(() => {
    if (loading && navigation?.setOptions) {
      navigation.setOptions({ title: 'Učitel' });
    } else if (info && info.name && navigation?.setOptions) {
      navigation.setOptions({ title: info.name });
    }
  }, [info, loading, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text>Načítám učitele…</Text>
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
  if (!info) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 0 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
            <TeacherImageViewer imageUrl={info.photo} />
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
              {routeName || info.name}
            </Text>
            <Text
              style={[
                styles.code,
                { color: theme.colors.primary, marginBottom: 12 },
              ]}
            >
              {info.code}
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
          {info.room && info.roomHref ? (
            <View style={[styles.infoRow, { marginBottom: 6 }]}>
              <Text style={styles.infoLabel}>Kabinet:</Text>
              <Pressable
                onPress={() => {
                  router.push(`/ucebna/${info.room}`);
                }}
              >
                <RNText
                  style={[
                    styles.infoValue,
                    { color: '#2196f3', textDecorationLine: 'underline' },
                  ]}
                >
                  {info.room}
                </RNText>
              </Pressable>
            </View>
          ) : (
            info.room && (
              <View style={[styles.infoRow, { marginBottom: 6 }]}>
                <Text style={styles.infoLabel}>Kabinet:</Text>
                <Text style={styles.infoValue} selectable={true}>
                  {info.room}
                </Text>
              </View>
            )
          )}
          {info.consultation && (
            <View style={[styles.infoRow, { marginBottom: 6 }]}>
              <Text style={styles.infoLabel}>Konzultační hodiny:</Text>
              <Text style={styles.infoValue} selectable={true}>
                {info.consultation}
              </Text>
            </View>
          )}
          {info.email && (
            <View style={[styles.infoRow, { marginBottom: 6 }]}>
              <Text style={styles.infoLabel}>E-mail:</Text>
              <Text style={styles.infoValue} selectable={true}>
                {info.email}
              </Text>
            </View>
          )}
          {info.privateEmail && (
            <View style={[styles.infoRow, { marginBottom: 6 }]}>
              <Text style={styles.infoLabel}>Soukromý e-mail:</Text>
              <Text style={styles.infoValue} selectable={true}>
                {info.privateEmail}
              </Text>
            </View>
          )}
          {info.phone && (
            <View style={[styles.infoRow, { marginBottom: 6 }]}>
              <Text style={styles.infoLabel}>Telefon:</Text>
              <Text style={styles.infoValue} selectable={true}>
                {info.phone}
              </Text>
            </View>
          )}
          {info.privatePhone && (
            <View style={[styles.infoRow, { marginBottom: 6 }]}>
              <Text style={styles.infoLabel}>Soukromý telefon:</Text>
              <Text style={styles.infoValue} selectable={true}>
                {info.privatePhone}
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
        {info.timetable &&
        info.timetable.periods &&
        info.timetable.days &&
        info.timetable.days.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TimetableGrid
              periods={info.timetable.periods as TimetablePeriod[]}
              days={info.timetable.days as TimetableDay[]}
              onRoomPress={room => router.push(`/ucebna/${room}`)}
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
        {info.certifications && info.certifications.length > 0 ? (
          info.certifications.map((cert: any, i: number) => (
            <View key={i} style={styles.certRow}>
              <Text style={{ fontWeight: 'bold', marginRight: 8 }}>
                {cert.date}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold' }}>{cert.label}</Text>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  {cert.institution}
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
    color: '#fff',
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
