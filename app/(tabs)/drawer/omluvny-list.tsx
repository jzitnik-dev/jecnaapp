import { useSpseJecnaClient } from '@/hooks/useSpseJecnaClient';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from 'expo-router/react-navigation';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AbsenceInfo, AbsencesPage } from 'jecnaapi-react-native/jecnaapi';
import { getAvaliableYears } from '@/utils/selectors';

export default function OmluvnyListScreen() {
  const { client } = useSpseJecnaClient();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const availableYears = useMemo(() => getAvaliableYears(), []);

  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0]);

  const { data, error, isLoading, isFetching, refetch } =
    useQuery<AbsencesPage | null>({
      queryKey: ['omluvnyList', selectedYear],
      queryFn: async () => {
        if (!client) return null;
        return await client.getOmluvnyList(selectedYear);
      },
      enabled: !!client,
    });

  const onRefresh = () => {
    refetch();
  };

  const onYearChange = (year: number) => {
    setSelectedYear(year);
    queryClient.prefetchQuery({
      queryKey: ['omluvnyList', year],
      queryFn: () => client?.getOmluvnyList(year),
    });
  };

  const absencesArray = useMemo(() => {
    if (!data?.absences) return [];
    return Object.entries(data.absences).map(([date, info]) => ({
      date,
      ...info,
    }));
  }, [data]);

  const renderAbsence = ({
    item,
  }: {
    item: AbsenceInfo & { date: string };
  }) => {
    const formattedDate = new Date(item.date).toLocaleDateString('cs-CZ');

    return (
      <View
        style={{
          marginHorizontal: 16,
          marginVertical: 8,
          borderRadius: 16,
          backgroundColor: theme.colors.card,
          padding: 16,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Text
          style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text }}
        >
          {formattedDate}
        </Text>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
        >
          <Text style={{ fontSize: 16, color: theme.colors.primary }}>
            {item.hoursAbsent} hodin
            {item.hoursAbsent === 1
              ? 'a'
              : item.hoursAbsent >= 2 && item.hoursAbsent <= 4
                ? 'y'
                : ''}
          </Text>

          {typeof item.lateEntryCount === 'number' && (
            <Text style={{ fontSize: 16, marginLeft: 6 }}>
              a {item.lateEntryCount}{' '}
              {item.lateEntryCount === 1
                ? 'pozdní příchod'
                : item.lateEntryCount >= 2 && item.lateEntryCount <= 4
                  ? 'pozdní příchody'
                  : 'pozdních příchodů'}
            </Text>
          )}

          {typeof item.unexcusedHours === 'number' &&
            item.unexcusedHours > 0 && (
              <Text style={{ fontSize: 16, color: 'red', marginLeft: 12 }}>
                z toho {item.unexcusedHours} neomluven
                {item.unexcusedHours === 1
                  ? 'á'
                  : item.unexcusedHours >= 2 && item.unexcusedHours <= 4
                    ? 'é'
                    : 'ých'}
              </Text>
            )}
        </View>
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: 16,
      }}
    >
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 8,
          borderRadius: 12,
          padding: 8,
          backgroundColor: theme.colors.card,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Picker
          selectedValue={selectedYear}
          onValueChange={onYearChange}
          style={{
            color: theme.colors.text,
            backgroundColor: theme.colors.card,
          }}
        >
          {availableYears.map(year => (
            <Picker.Item
              key={year}
              label={`${year}/${year + 1}`}
              value={year}
            />
          ))}
        </Picker>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.primary || theme.colors.text}
          style={{ marginTop: 32 }}
        />
      ) : error ? (
        <Text style={{ color: 'red', margin: 16 }}>
          Nepodařilo se načíst omluvný list.
        </Text>
      ) : absencesArray.length === 0 ? (
        <Text style={{ margin: 16, color: theme.colors.text }}>
          Žádné absence v tomto školním roce.
        </Text>
      ) : (
        <FlatList
          data={absencesArray}
          keyExtractor={item => item.date}
          renderItem={renderAbsence}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={onRefresh}
              colors={[theme.colors.primary || theme.colors.text]}
              progressBackgroundColor={theme.colors.background}
            />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}
