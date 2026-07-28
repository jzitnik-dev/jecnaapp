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
import { useRouter, useNavigation } from 'expo-router';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Canteen } from 'jecnaapi-react-native';
import { DayMenu, MenuItem } from 'jecnaapi-react-native/canteen';

const allergenColors: { [key: string]: string } = {
  '1': '#FF6B6B',
  '2': '#4ECDC4',
  '3': '#45B7D1',
  '4': '#96CEB4',
  '5': '#FFEAA7',
  '6': '#DDA0DD',
  '7': '#98D8C8',
  '8': '#F7DC6F',
  '9': '#BB8FCE',
  '10': '#F8C471',
  '11': '#85C1E9',
  '12': '#F1948A',
  '13': '#82E0AA',
  '14': '#F9E79F',
};

const allergenNames: { [key: string]: string } = {
  '1': 'Obiloviny',
  '2': 'Korýši',
  '3': 'Vejce',
  '4': 'Ryby',
  '5': 'Arašídy',
  '6': 'Sója',
  '7': 'Mléko',
  '8': 'Ořechy',
  '9': 'Celer',
  '10': 'Hořčice',
  '11': 'Sezam',
  '12': 'Oxid siřičitý',
  '13': 'Vlčí bob',
  '14': 'Měkkýši',
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
  const days = [
    'Neděle',
    'Pondělí',
    'Úterý',
    'Středa',
    'Čtvrtek',
    'Pátek',
    'Sobota',
  ];
  return `${days[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}.`;
}

export default function Jidelna() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
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
          <Text
            style={[styles.headerCreditText, { color: theme.colors.onSurface }]}
          >
            {creditData !== undefined ? `${creditData} Kč` : '...'}
          </Text>
        </View>
      ),
    });
  }, [navigation, creditData, theme, textColor]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['canteenMenu'],
    queryFn: async ({ pageParam = 0 }) => {
      const days = getDaysForPage(pageParam);
      return await Canteen.getMenuAsync(days);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const hasFoodInLastPage = lastPage?.some(day => day.items?.length > 0);

      if (!hasFoodInLastPage && allPages.length > 3) {
        return undefined;
      }

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
        if (response.credit !== undefined) {
          queryClient.setQueryData(['canteenCredit'], response.credit);
        }
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

  const renderMenuItem = ({ item: dayMenu }: { item: DayMenu }) => (
    <View style={[styles.menuCard, { backgroundColor: cardBackground }]}>
      <View style={styles.dateHeader}>
        <Text style={[styles.dateText, { color: textColor }]}>
          {formatDateToCzech(dayMenu.day)}
        </Text>
      </View>

      <View style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dayMenu.items.map(el => {
          const itemKey = `${dayMenu.day.toString()}-${el.number}`;
          const isProcessing = ordering === itemKey;
          const isProcessingExchange = ordering === `exchange-${itemKey}`;

          return (
            <View
              key={el.number}
              style={[
                styles.foodItemContainer,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              {el.isOrdered && (
                <Badge style={styles.orderedBadge} size={25}>
                  Objednáno
                </Badge>
              )}
              {el.isInExchange && (
                <Badge style={styles.exchangeBadge} size={25}>
                  V burze
                </Badge>
              )}

              {el.description.soup && (
                <View style={styles.foodSection}>
                  <Text style={[styles.foodTitle, { color: textColor }]}>
                    Polévka
                  </Text>
                  <Text style={[styles.foodDescription, { color: textColor }]}>
                    {el.description.soup}
                  </Text>
                </View>
              )}

              <View style={styles.foodSection}>
                <Text style={[styles.foodTitle, { color: textColor }]}>
                  Jídlo {el.number}
                </Text>
                <Text style={[styles.foodDescription, { color: textColor }]}>
                  {el.description.rest}
                </Text>
              </View>

              <View style={styles.priceSection}>
                <Text style={[styles.priceText, { color: textColor }]}>
                  {el.price} Kč
                </Text>
              </View>

              {el.allergens && el.allergens.length > 0 && (
                <View style={styles.allergenSection}>
                  <Text style={[styles.allergenTitle, { color: textColor }]}>
                    Alergeny
                  </Text>
                  <View style={styles.allergenList}>
                    {el.allergens.map((allergen, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.allergenBadge,
                          {
                            backgroundColor: allergenColors[allergen] || '#999',
                          },
                        ]}
                        onPress={() =>
                          Alert.alert(
                            'Alergen',
                            allergenNames[allergen] || 'Neznámý'
                          )
                        }
                      >
                        <Text style={styles.allergenText}>{allergen}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.actionRow}>
                {el.isEnabled && (
                  <TouchableOpacity
                    style={[
                      styles.orderButton,
                      {
                        backgroundColor: el.isOrdered ? '#E53935' : '#4CAF50',
                        opacity: isProcessing || isFetching ? 0.7 : 1,
                        flex: 1,
                        justifyContent: 'center',
                      },
                    ]}
                    onPress={() => handleOrder(el, dayMenu.day)}
                    disabled={ordering !== undefined || isFetching}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons
                          name={
                            el.isOrdered
                              ? 'close-circle-outline'
                              : 'cart-outline'
                          }
                          size={20}
                          color="white"
                        />
                        <Text style={styles.orderButtonText}>
                          {el.isOrdered ? 'Zrušit' : 'Objednat'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {el.isOrdered && el.putOnExchangePath && !el.isInExchange && (
                  <TouchableOpacity
                    style={[
                      styles.orderButton,
                      {
                        backgroundColor: '#FF9800',
                        opacity: isProcessingExchange || isFetching ? 0.7 : 1,
                        marginLeft: 8,
                        paddingHorizontal: 12,
                        justifyContent: 'center',
                      },
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
      style={[
        styles.orderButton,
        {
          backgroundColor: theme.colors.surface,
          marginBottom: 16,
          justifyContent: 'space-between',
        },
      ]}
      onPress={() => router.push('/jidelna/burza')}
    >
      <Text
        style={{
          color: theme.colors.onSurface,
          fontWeight: 'bold',
          fontSize: 16,
        }}
      >
        Burza
      </Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={16}
        color={theme.colors.onSurfaceVariant}
      />
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={textColor} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerAlign, { backgroundColor }]}>
        <ActivityIndicator size="large" color={textColor} />
        <Text style={[styles.loadingText, { color: textColor }]}>
          Načítání jídelníčku...
        </Text>
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
          <View
            style={[styles.emptyState, { backgroundColor: cardBackground }]}
          >
            <Ionicons name="restaurant-outline" size={64} color={textColor} />
            <Text style={[styles.emptyText, { color: textColor }]}>
              Žádné jídlo k dispozici
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
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
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  centerAlign: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerRightContainer: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerCreditText: {
    marginRight: 15,
    fontWeight: 'bold',
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
    marginBottom: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  foodItemContainer: {
    borderRadius: 4,
    paddingVertical: 15,
    paddingHorizontal: 15,
    position: 'relative',
  },
  orderedBadge: {
    backgroundColor: 'green',
    color: 'white',
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
  },
  exchangeBadge: {
    backgroundColor: '#FF9800',
    color: 'white',
    position: 'absolute',
    right: 10,
    top: 38,
    zIndex: 1,
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
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
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
