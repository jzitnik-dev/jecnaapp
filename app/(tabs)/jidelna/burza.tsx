import { CanteenBurzaItem } from '@/api/iCanteenClient';
import { useSpseJecnaClient } from '@/hooks/useSpseJecnaClient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { RefreshControl, ScrollView, View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function BurzaScreen() {
  const navigation = useNavigation();
  const { client: spseClient } = useSpseJecnaClient();
  const theme = useTheme();

  const menuQuery = useQuery<CanteenBurzaItem[], Error>({
    queryKey: ['canteenMenuBurza'],
    queryFn: async () => {
      if (!spseClient) {
        throw new Error('SpseJecnaClient not available. Please login first.');
      }
      const canteenClient = await spseClient.getCanteenClient();
      const menu = await canteenClient.getBurza();

      // update header with credit
      navigation.setOptions({
        title: 'Burza',
        headerRight: () => (
          <View
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            <Ionicons
              name="wallet-outline"
              size={20}
              color={theme.colors.onBackground}
            />
            <Text
              style={{
                marginRight: 15,
                fontWeight: 'bold',
                color: theme.colors.onSurface,
              }}
            >
              {menu.credit}
            </Text>
          </View>
        ),
      });

      return menu.data;
    },
    enabled: !!spseClient,
    staleTime: 10 * 60 * 60 * 1000,
    retry: 1,
  });

  const menuData = menuQuery.data;

  useEffect(() => {
    navigation.setOptions({ title: 'Burza' });
  }, [navigation]);

  return (
    <ScrollView
      style={[styles.container]}
      refreshControl={
        <RefreshControl
          refreshing={menuQuery.isFetching}
          onRefresh={() => menuQuery.refetch()}
        />
      }
    >
      {(!menuData || menuData.length === 0) && (
        <View
          style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}
        >
          <Ionicons
            name="restaurant-outline"
            size={64}
            color={theme.colors.onSurface}
          />
          <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
            Žádné jídlo v burze k dispozici
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerItem: {
    alignItems: 'center',
    flex: 1,
  },
  headerLabel: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  headerValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  menuCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  foodSection: {
    marginBottom: 12,
  },
  foodTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    opacity: 0.7,
  },
  foodDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  priceSection: {
    marginBottom: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  allergenSection: {
    marginBottom: 12,
  },
  allergenTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    opacity: 0.7,
  },
  allergenList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  allergenText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timingSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  timingInfo: {
    marginLeft: 8,
    flex: 1,
  },
  timingText: {
    fontSize: 14,
    marginBottom: 2,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  orderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    opacity: 0.7,
  },
});
