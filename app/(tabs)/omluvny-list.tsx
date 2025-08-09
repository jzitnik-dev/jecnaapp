import { useSpseJecnaClient } from '@/hooks/useSpseJecnaClient';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  View,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  OmluvnyListAbsence,
  OmluvnyListResult,
} from '../../api/SpseJecnaClient';
import { Text } from 'react-native-paper';

export default function OmluvnyListScreen() {
  const { client } = useSpseJecnaClient();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<OmluvnyListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string | undefined>(
    undefined
  );
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (yearId?: string) => {
      if (!client) return;
      setLoading(true);
      setError(null);
      try {
        const result = await client.getOmluvnyList(yearId);
        setData(result);
        setSelectedYear(result.selectedYearId);
      } catch {
        setError('Nepodařilo se načíst omluvný list.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [client]
  );

  useEffect(() => {
    if (client) fetchData();
  }, [fetchData, client]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(selectedYear);
  }, [fetchData, selectedYear]);

  const onYearChange = (yearId: string) => {
    setSelectedYear(yearId);
    fetchData(yearId);
  };

  const renderAbsence = ({ item }: { item: OmluvnyListAbsence }) => (
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
      <Pressable
        onPress={() =>
          item.href && Linking.openURL('https://www.spsejecna.cz' + item.href)
        }
        disabled={!item.href}
        style={({ pressed }) => [{ opacity: pressed && item.href ? 0.6 : 1 }]}
      >
        <Text
          style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text }}
        >
          {item.date}
        </Text>
      </Pressable>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
      >
        <Text style={{ fontSize: 16, color: theme.colors.text }}>
          {item.count} hodin{item.count === 1 ? 'a' : 'y'}
        </Text>
        {typeof item.countUnexcused === 'number' && (
          <Text style={{ fontSize: 16, color: 'red', marginLeft: 12 }}>
            {item.countUnexcused} neomluvena
            {item.countUnexcused === 1 ? '' : 'y'}
          </Text>
        )}
      </View>
    </View>
  );

  if (!client) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary || theme.colors.text}
        />
        <Text style={{ marginTop: 16, color: theme.colors.text }}>
          Načítám klienta…
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: 16,
      }}
    >
      {data && data.years.length > 0 && (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 8,
            borderRadius: 12,
            backgroundColor: theme.colors.card,
            padding: 8,
          }}
        >
          <Picker
            selectedValue={selectedYear}
            onValueChange={onYearChange}
            style={{ color: theme.colors.text }}
          >
            {data.years.map(year => (
              <Picker.Item key={year.id} label={year.label} value={year.id} />
            ))}
          </Picker>
        </View>
      )}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.primary || theme.colors.text}
          style={{ marginTop: 32 }}
        />
      ) : error ? (
        <Text style={{ color: 'red', margin: 16 }}>{error}</Text>
      ) : !data || data.absences.length === 0 ? (
        <Text style={{ margin: 16, color: theme.colors.text }}>
          Žádné absence v tomto školním roce.
        </Text>
      ) : (
        <FlatList
          data={data.absences}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderAbsence}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
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
