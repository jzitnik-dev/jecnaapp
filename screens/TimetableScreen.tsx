import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Menu, Text, useTheme } from 'react-native-paper';
import { TimetableGrid } from '@/components/TimetableGrid';
import ExtraReport from '@/components/ExtraReport';
import { YearSelector } from '@/utils/selectors';
import { PeriodOption } from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { JecnaAPI } from '@jzitnik/jecnaapi-react-native';
import { useAccountInfo } from '@/hooks/useAccountInfo';
import { useJecnaRozvrhClient } from '@/hooks/useJecnaRozvrhClient';
import { SubstitutionSummary } from '@/components/timetable/supl';
import { useSecureStore } from '@/hooks/useSecureStore';
import { Ionicons } from '@expo/vector-icons';
import { useLayoutPaths } from '@/lib/layoutPaths';

function getPeriodStr(period?: PeriodOption) {
  if (!period) {
    return '?';
  }

  const fromStr = period.from.toLocaleDateString('cs-CZ');
  const toStr = period.to?.toLocaleDateString('cs-CZ') || '?';

  const periodStr = period.header
    ? `${period.header}: ${fromStr} - ${toStr}`
    : `${fromStr} - ${toStr}`;

  return periodStr;
}

export default function RozvrhScreen() {
  const theme = useTheme();
  const [periodMenuVisible, setPeriodMenuVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(
    undefined
  );
  const [selectedPeriod, setSelectedPeriod] = useState<number | undefined>(
    undefined
  );
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const { data, error, refetch, isFetching } = useQuery({
    queryKey: ['timetable', selectedYear, selectedPeriod],
    queryFn: async () => {
      if (selectedYear === undefined) {
        return JecnaAPI.getTimetablePage();
      }

      return JecnaAPI.getTimetablePage({
        schoolYear: selectedYear,
        periodOptionId: selectedPeriod,
      });
    },
  });

  const { accountInfo } = useAccountInfo();
  const { client: extraordClient } = useJecnaRozvrhClient();

  const { data: extraordinaryData } = useQuery({
    queryKey: ['extraordinarytimetable', accountInfo?.className],
    queryFn: async () => {
      return await extraordClient?.getSchedule(accountInfo?.className || '');
    },
    enabled: !!extraordClient && !!accountInfo,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const [extraordenabled] = useSecureStore<boolean>(
    'extraordinary_schedule_enabled',
    {
      initialValue: false,
      parse: val => val === 'true',
      stringify: val => (val ? 'true' : 'false'),
    }
  );

  useEffect(() => {
    if (extraordenabled) {
      navigation.setOptions({
        headerRight: () => (
          <View
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            <TouchableOpacity
              style={{
                borderRadius: 4,
                paddingVertical: 15,
                paddingHorizontal: 15,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons
                name="alert-circle-outline"
                size={25}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>
          </View>
        ),
      });
    } else {
      navigation.setOptions({
        headerRight: () => <></>,
      });
    }
  }, [extraordenabled, navigation, theme]);

  const [showExtra, setShowExtra] = useState<boolean>(true);

  const router = useRouter();
  const paths = useLayoutPaths();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ExtraReport
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
      />

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
        {extraordenabled && (
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
        <YearSelector
          selected={selectedYear}
          handleSelectYear={year => {
            setSelectedYear(year);
            setSelectedPeriod(undefined);
          }}
        />

        <Menu
          visible={periodMenuVisible}
          onDismiss={() => setPeriodMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setPeriodMenuVisible(true)}>
              {getPeriodStr(data?.periodOptions.find(p => p.selected))}
            </Button>
          }
        >
          {data?.periodOptions.map(p => {
            return (
              <Menu.Item
                key={p.id}
                onPress={() => {
                  setSelectedPeriod(p.id);
                }}
                title={getPeriodStr(p)}
              />
            );
          })}
        </Menu>
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={['#fff']}
            progressBackgroundColor={'#23272e'}
          />
        }
      >
        {extraordenabled && (
          <SubstitutionSummary
            suplResult={extraordinaryData}
            style={styles.summary}
          />
        )}

        {data?.timetable && (
          <ScrollView horizontal contentContainerStyle={styles.scrollContent}>
            <TimetableGrid
              timetable={data.timetable}
              onTeacherPress={code => router.push(paths.teacher(code) as Href)}
              onRoomPress={room => router.push(paths.room(room) as Href)}
              extraordinary={extraordinaryData}
              showExtraordinary={extraordenabled && showExtra}
              showClass={false}
            />
          </ScrollView>
        )}

        {error && (
          <View style={styles.centered}>
            <Text style={{ color: 'red', marginTop: 24 }}>{String(error)}</Text>
          </View>
        )}
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
  summary: {
    padding: 12,
  },
  scrollContent: {
    padding: 12,
    alignItems: 'stretch',
  },
});
