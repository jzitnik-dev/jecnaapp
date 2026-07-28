import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Menu, Text, useTheme } from 'react-native-paper';
import { TimetableGrid } from '../../../components/TimetableGrid';
import ExtraReport from '@/components/ExtraReport';
import { YearSelector } from '@/utils/selectors';
import { PeriodOption } from 'jecnaapi-react-native/jecnaapi';
import { JecnaAPI } from 'jecnaapi-react-native';

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

  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ExtraReport
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        reportLocation="TIMETABLE"
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
        {data?.timetable && (
          <ScrollView horizontal contentContainerStyle={styles.scrollContent}>
            <TimetableGrid
              timetable={data.timetable}
              onTeacherPress={code => router.push(`/teachers/${code}`)}
              onRoomPress={room => router.push(`/ucebna/${room}`)}
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
  scrollContent: {
    padding: 12,
    alignItems: 'stretch',
  },
});
