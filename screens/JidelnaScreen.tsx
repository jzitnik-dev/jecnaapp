import { Badge, useTheme } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useMemo, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import { useRouter, useNavigation, type Href } from 'expo-router';
import { useLayoutPaths } from '@/lib/layoutPaths';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Canteen } from '@jzitnik/jecnaapi-react-native';
import { DayMenu, MenuItem } from '@jzitnik/jecnaapi-react-native/canteen';

const allergenNames: { [key: string]: string } = {
  '1': 'Obiloviny', '2': 'Korýši', '3': 'Vejce', '4': 'Ryby',
  '5': 'Arašídy', '6': 'Sója', '7': 'Mléko', '8': 'Ořechy',
  '9': 'Celer', '10': 'Hořčice', '11': 'Sezam', '12': 'Oxid siřičitý',
  '13': 'Vlčí bob', '14': 'Měkkýši',
};

const DAYS_PER_PAGE = 7;

function getDaysForPage(pageParam: number): Date[] {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + pageParam * DAYS_PER_PAGE);

  return Array.from({ length: DAYS_PER_PAGE }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDateToCzech(dateString: Date | string) {
  const d = new Date(dateString);
  const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
  return `${days[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}.`;
}

export default function Jidelna() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const paths = useLayoutPaths();
  const queryClient = useQueryClient();
  const [ordering, setOrdering] = useState<string | undefined>();

  const backgroundColor = theme.colors.background;
  const textColor = theme.colors.onBackground;
  const cardBackground = theme.colors.surface;

  const { data: creditData } = useQuery({
    queryKey: ['canteenCredit'],
    queryFn: Canteen.getCredit,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <Ionicons name="wallet-outline" size={20} color={textColor} />
          <Text style={[styles.headerCreditText, { color: theme.colors.onSurface }]}>
            {creditData !== undefined ? `${creditData} Kč` : '...'}
          </Text>
        </View>
      ),
    });
  }, [navigation, creditData, theme, textColor]);

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage,
    isFetching, isLoading, refetch,
  } = useInfiniteQuery({
    queryKey: ['canteenMenuFlow'],
    queryFn: async ({ pageParam = 0 }) => {
      const days = getDaysForPage(pageParam);
      return await Canteen.getMenuAsync(days);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const hasFoodInLastPage = lastPage?.some(day => day.items?.length > 0);
      if (!hasFoodInLastPage && allPages.length > 3) return undefined;
      return allPages.length;
    },
    staleTime: 10 * 60 * 1000,
  });

  const menuData = useMemo(() => {
    if (!data) return [];
    return data.pages.flat().filter(day => day.items?.length > 0);
  }, [data]);

  const handleOrder = async (item: MenuItem, dayDate: Date) => {
    const itemKey = `${dayDate.toString()}-${item.number}`;
    setOrdering(itemKey);
    try {
      const response = await Canteen.order(item);
      if (response.success) {
        if (response.credit !== undefined) queryClient.setQueryData(['canteenCredit'], response.credit);
        await refetch();
      } else {
        Alert.alert('Chyba', 'Akci se nepodařilo provést.');
      }
    } catch (e) {
      Alert.alert('Chyba', 'Nastala neočekávaná chyba.');
    } finally {
      setOrdering(undefined);
    }
  };

  const handleExchange = async (item: MenuItem, dayDate: Date) => {
    const itemKey = `exchange-${dayDate.toString()}-${item.number}`;
    setOrdering(itemKey);
    try {
      await Canteen.putOnExchange(item);
      await refetch();
    } catch (e) {
      Alert.alert('Chyba', 'Nepodařilo se vložit jídlo do burzy.');
    } finally {
      setOrdering(undefined);
    }
  };

  const showAllergens = (allergens: string[]) => {
    const message = allergens
      .map(a => `${a}: ${allergenNames[a] || 'Neznámý'}`)
      .join('\n');
    Alert.alert('Alergeny', message);
  };

  const renderMenuItem = ({ item: dayMenu }: { item: DayMenu }) => (
    <View style={[styles.menuCard, { backgroundColor: cardBackground }]}>
      <View style={styles.dateHeader}>
        <Text style={[styles.dateText, { color: textColor }]}>
          {formatDateToCzech(dayMenu.day)}
        </Text>
      </View>

      <View style={styles.foodItemsWrapper}>
        {dayMenu.items.map(el => {
          const itemKey = `${dayMenu.day.toString()}-${el.number}`;
          const isProcessing = ordering === itemKey;
          const isProcessingExchange = ordering === `exchange-${itemKey}`;

          return (
            <View
              key={el.number}
              style={[styles.foodItemContainer, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <View style={styles.topRow}>
                <View style={styles.titlePriceRow}>
                  <Text style={[styles.foodTitle, { color: textColor }]}>Jídlo {el.number}</Text>
                  <Text style={[styles.priceText, { color: textColor }]}>{el.price} Kč</Text>
                </View>
                <View style={styles.topRightActions}>
                  <View style={styles.badgeContainer}>
                    {el.isOrdered && <Badge style={styles.orderedBadge} size={22}>Objednáno</Badge>}
                    {el.isInExchange && <Badge style={styles.exchangeBadge} size={22}>V burze</Badge>}
                  </View>
                  {el.allergens && el.allergens.length > 0 && (
                    <TouchableOpacity
                      onPress={() => showAllergens(el.allergens)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.infoButton}
                    >
                      <Ionicons name="information-circle-outline" size={22} color={textColor} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.descriptionBlock}>
                {!!el.description?.soup && (
                  <Text style={[styles.foodDescription, { color: textColor }]}>
                    <Text style={styles.label}>Polévka: </Text>{el.description.soup}
                  </Text>
                )}
                {!!el.description?.rest && (
                  <Text style={[styles.foodDescription, { color: textColor }]}>
                    <Text style={styles.label}>Hlavní: </Text>{el.description.rest}
                  </Text>
                )}
              </View>

              <View style={styles.actionRow}>
                {el.isEnabled && (
                  <TouchableOpacity
                    style={[
                      styles.orderButton,
                      { backgroundColor: el.isOrdered ? '#E53935' : '#4CAF50', opacity: isProcessing || isFetching ? 0.7 : 1 }
                    ]}
                    onPress={() => handleOrder(el, dayMenu.day)}
                    disabled={ordering !== undefined || isFetching}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name={el.isOrdered ? 'close-circle-outline' : 'cart-outline'} size={18} color="white" />
                        <Text style={styles.orderButtonText}>{el.isOrdered ? 'Zrušit' : 'Objednat'}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {el.isOrdered && el.putOnExchangePath && !el.isInExchange && (
                  <TouchableOpacity
                    style={[
                      styles.orderButton, styles.exchangeButton,
                      { opacity: isProcessingExchange || isFetching ? 0.7 : 1 }
                    ]}
                    onPress={() => handleExchange(el, dayMenu.day)}
                    disabled={ordering !== undefined || isFetching}
                  >
                    {isProcessingExchange ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.orderButtonText}>Do burzy</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderHeader = () => (
    <TouchableOpacity
      style={[styles.burzaHeaderButton, { backgroundColor: theme.colors.surface }]}
      onPress={() => router.push(paths.burza as Href)}
    >
      <Text style={[styles.burzaHeaderText, { color: theme.colors.onSurface }]}>Burza</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
    </TouchableOpacity>
  );

  const renderFooter = () => isFetchingNextPage ? (
    <View style={styles.footerLoader}><ActivityIndicator size="small" color={textColor} /></View>
  ) : null;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerAlign, { backgroundColor }]}>
        <ActivityIndicator size="large" color={textColor} />
        <Text style={[styles.loadingText, { color: textColor }]}>Načítání jídelníčku...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={menuData}
        keyExtractor={item => item.day.toString()}
        renderItem={renderMenuItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: cardBackground }]}>
            <Ionicons name="restaurant-outline" size={64} color={textColor} />
            <Text style={[styles.emptyText, { color: textColor }]}>Žádné jídlo k dispozici</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isFetchingNextPage}
            onRefresh={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ['canteenCredit'] });
            }}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 12 },
  centerAlign: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  headerRightContainer: { display: 'flex', gap: 8, alignItems: 'center', flexDirection: 'row' },
  headerCreditText: { marginRight: 15, fontWeight: 'bold' },
  
  burzaHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    justifyContent: 'space-between',
    elevation: 1,
  },
  burzaHeaderText: { fontWeight: 'bold', fontSize: 16 },
  
  menuCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dateHeader: { marginBottom: 10 },
  dateText: { fontSize: 17, fontWeight: 'bold' },
  foodItemsWrapper: { display: 'flex', flexDirection: 'column', gap: 10 },
  
  foodItemContainer: {
    borderRadius: 8,
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titlePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  foodTitle: { fontSize: 15, fontWeight: 'bold' },
  priceText: { fontSize: 14, fontWeight: 'bold', color: '#4CAF50' },
  
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeContainer: {
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-end',
  },
  orderedBadge: { backgroundColor: 'green', color: 'white' },
  exchangeBadge: { backgroundColor: '#FF9800', color: 'white' },
  infoButton: {
    opacity: 0.7,
  },
  
  descriptionBlock: { marginBottom: 12 },
  label: { fontWeight: 'bold', fontSize: 13, opacity: 0.8 },
  foodDescription: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  orderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  exchangeButton: { backgroundColor: '#FF9800', flex: 0.4 },
  orderButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
  
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 12 },
  emptyText: { fontSize: 15, marginTop: 12, opacity: 0.7 },
});
