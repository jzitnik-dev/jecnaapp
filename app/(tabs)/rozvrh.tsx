import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Menu,
  Text,
  useTheme,
} from 'react-native-paper';
import type {
  ExtraordinaryTimetable,
  Timetable,
} from '../../api/SpseJecnaClient';
import { TimetableGrid } from '../../components/TimetableGrid';
import { useSpseJecnaClient } from '../../hooks/useSpseJecnaClient';
import * as SecureStore from 'expo-secure-store';
import { useAccountInfo } from '@/hooks/useAccountInfo';

export default function RozvrhScreen() {
  const { client } = useSpseJecnaClient();
  const theme = useTheme();
  const { accountInfo } = useAccountInfo();
  const [yearMenuVisible, setYearMenuVisible] = useState(false);
  const [periodMenuVisible, setPeriodMenuVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string | undefined>(
    undefined
  );
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(
    undefined
  );
  const { data, error, isLoading, refetch, isFetching } = useQuery<Timetable>({
    queryKey: ['timetable', selectedYear, selectedPeriod],
    queryFn: async () => {
      if (!client) throw new Error('Not logged in');
      return client.getTimetable(selectedYear, selectedPeriod);
    },
    enabled: !!client,
  });
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const [extraenabled, setExtraEnabled] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  useEffect(() => {
    (async () => {
      const enabled =
        (await SecureStore.getItemAsync('extraordinary_schedule_enabled')) ===
        'true';
      if (enabled) {
        setExtraEnabled(true);
        setShowExtra(true);
      }
    })();
  }, []);
  const { data: extraordinaryData, refetch: extraRefetch } =
    useQuery<ExtraordinaryTimetable>({
      queryKey: ['extraordinarytimetable', selectedYear, selectedPeriod],
      queryFn: async () => {
        if (!client) throw new Error('Not logged in');
        return await client.getExtraordinaryTimetable();
      },
      enabled: !!client && showExtra, // fetch only if client exists and showExtra is true
    });

  useEffect(() => {
    if (showExtra) {
      extraRefetch();
    }
  }, [showExtra, extraRefetch]);

  // Handle selects
  const meta = data?.meta;
  React.useEffect(() => {
    if (meta) {
      if (!selectedYear || !meta.years.some(y => y.id === selectedYear)) {
        setSelectedYear(meta.selectedYearId);
      }
      if (!selectedPeriod || !meta.periods.some(p => p.id === selectedPeriod)) {
        setSelectedPeriod(meta.selectedPeriodId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!client) {
    return (
      <View style={styles.centered}>
        <Text style={{ marginTop: 24 }}>Přihlaste se prosím.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={{ marginTop: 16 }}>Načítám rozvrh…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red', marginTop: 24 }}>{String(error)}</Text>
        <Button
          mode="contained"
          onPress={() => {
            setSelectedYear(undefined);
            setSelectedPeriod(undefined);
            refetch();
          }}
          style={{ marginTop: 16 }}
        >
          Resetovat výběr
        </Button>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={{ marginTop: 24 }}>Rozvrh nebyl nalezen.</Text>
      </View>
    );
  }

  // Responsive cell width
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 56 }}
        contentContainerStyle={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 12,
          paddingTop: 12,
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        {extraenabled && (
          <Button
            mode="outlined"
            style={{
              backgroundColor: showExtra ? theme.colors.primary : undefined,
            }}
            labelStyle={{
              color: showExtra ? theme.colors.background : theme.colors.primary,
            }}
            onPress={() => setShowExtra(prev => !prev)}
          >
            Mimořádný rozvrh
          </Button>
        )}

        {/* Year select */}
        <Menu
          visible={yearMenuVisible}
          onDismiss={() => setYearMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setYearMenuVisible(true)}>
              {meta?.years.find(y => y.id === selectedYear)?.label || 'Rok'}
            </Button>
          }
        >
          {meta?.years.map(y => (
            <Menu.Item
              key={y.id}
              onPress={() => {
                setSelectedYear(y.id);
                setYearMenuVisible(false);
              }}
              title={y.label}
            />
          ))}
        </Menu>
        {/* Period select */}
        <Menu
          visible={periodMenuVisible}
          onDismiss={() => setPeriodMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setPeriodMenuVisible(true)}>
              {meta?.periods.find(p => p.id === selectedPeriod)?.label ||
                'Období'}
            </Button>
          }
        >
          {meta?.periods.map(p => (
            <Menu.Item
              key={p.id}
              onPress={() => {
                setSelectedPeriod(p.id);
                setPeriodMenuVisible(false);
              }}
              title={p.label}
            />
          ))}
        </Menu>
        {(isFetching || isLoading) && (
          <ActivityIndicator size={18} style={{ marginLeft: 8 }} />
        )}
      </ScrollView>
      <ScrollView
        horizontal
        style={{ flex: 1 }}
        contentContainerStyle={{ minWidth: screenWidth }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            colors={['#fff']}
            progressBackgroundColor={'#23272e'}
          />
        }
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
        >
          <TimetableGrid
            periods={data.periods}
            days={data.days}
            onTeacherPress={code => {
              if (typeof code === 'string' && code.length > 0) {
                router.push(`/teachers/${code}`);
              }
            }}
            onRoomPress={room => router.push(`/ucebna/${room}`)}
            extraordinary={showExtra ? extraordinaryData : null}
            class={accountInfo?.class || 'sakjdlkajsdlkjasd'}
          />
        </ScrollView>
      </ScrollView>
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
    padding: 12,
    alignItems: 'stretch',
  },
  table: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  stickyHeader: {
    ...Platform.select({
      web: { position: 'sticky', top: 0, zIndex: 10 },
      default: {},
    }),
  },
  headerCell: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderTopWidth: 0,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dayCell: {
    padding: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  dayText: {
    fontWeight: 'bold',
    fontSize: 17,
  },
  cell: {
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
    minHeight: 0,
    backgroundColor: 'transparent',
  },
  lessonSquare: {
    borderColor: '#333',
    borderRadius: 0,
    margin: 0,
    paddingLeft: 10,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'stretch',
    minHeight: 0,
    minWidth: 0,
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    width: '100%',
  },
  teacherSquare: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 0,
    textAlign: 'left',
    width: '100%',
  },
  subjectSquare: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 0,
    textAlign: 'left',
    width: '100%',
  },
  roomSquare: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 2,
    textAlign: 'right',
    width: '100%',
  },
  groupSquare: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'left',
    width: '100%',
  },
});
