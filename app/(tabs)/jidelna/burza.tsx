import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from 'expo-router';
import { Canteen } from 'jecnaapi-react-native';
import { ExchangeItem } from 'jecnaapi-react-native/canteen';
import { useEffect, useState } from 'react';
import {
  RefreshControl,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';

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

export default function BurzaScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [ordering, setOrdering] = useState<string | undefined>();

  const { data: creditData } = useQuery({
    queryKey: ['canteenCredit'],
    queryFn: Canteen.getCredit,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    navigation.setOptions({
      title: 'Burza',
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <Ionicons
            name="wallet-outline"
            size={20}
            color={theme.colors.onBackground}
          />
          <Text
            style={[styles.headerCreditText, { color: theme.colors.onSurface }]}
          >
            {creditData !== undefined ? `${creditData} Kč` : '...'}
          </Text>
        </View>
      ),
    });
  }, [navigation, creditData, theme]);

  const {
    data: exchangeData,
    isFetching,
    refetch,
    isLoading,
  } = useQuery<ExchangeItem[], Error>({
    queryKey: ['canteenExchange'],
    queryFn: Canteen.getExchange,
    staleTime: 2 * 60 * 1000,
  });

  const handleOrder = async (item: ExchangeItem) => {
    setOrdering(item.orderPath);
    try {
      const response = await Canteen.order(item);
      if (response.success) {
        if (response.credit !== undefined) {
          queryClient.setQueryData(['canteenCredit'], response.credit);
        }
        await refetch();
        queryClient.invalidateQueries({ queryKey: ['canteenMenu'] });
      } else {
        Alert.alert(
          'Chyba',
          'Nepodařilo se objednat jídlo z burzy. Možná už ho někdo vybral.'
        );
      }
    } catch (e) {
      Alert.alert('Chyba', 'Nastala neočekávaná chyba při objednávání.');
    } finally {
      setOrdering(undefined);
    }
  };

  const renderExchangeItem = ({ item }: { item: ExchangeItem }) => {
    const isProcessing = ordering === item.orderPath;

    return (
      <View
        style={[styles.menuCard, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.dateHeader}>
          <Text style={[styles.dateText, { color: theme.colors.onSurface }]}>
            {formatDateToCzech(item.day)}
          </Text>
          <View style={styles.amountBadge}>
            <Text style={styles.amountText}>K dispozici: {item.amount}x</Text>
          </View>
        </View>

        {item.description.soup && (
          <View style={styles.foodSection}>
            <Text style={[styles.foodTitle, { color: theme.colors.onSurface }]}>
              Polévka
            </Text>
            <Text
              style={[
                styles.foodDescription,
                { color: theme.colors.onSurface },
              ]}
            >
              {item.description.soup}
            </Text>
          </View>
        )}

        <View style={styles.foodSection}>
          <Text style={[styles.foodTitle, { color: theme.colors.onSurface }]}>
            Jídlo {item.number}
          </Text>
          <Text
            style={[styles.foodDescription, { color: theme.colors.onSurface }]}
          >
            {item.description.rest}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.orderButton,
            {
              backgroundColor: '#4CAF50',
              justifyContent: isProcessing ? 'center' : 'flex-start',
              opacity: isProcessing || isFetching ? 0.7 : 1,
            },
          ]}
          onPress={() => handleOrder(item)}
          disabled={ordering !== undefined || isFetching}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="cart-outline" size={20} color="white" />
              <Text style={styles.orderButtonText}>Objednat z burzy</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerAlign,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.onBackground} />
        <Text
          style={[styles.loadingText, { color: theme.colors.onBackground }]}
        >
          Načítání burzy...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={exchangeData}
        keyExtractor={item => item.orderPath}
        renderItem={renderExchangeItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ['canteenCredit'] });
            }}
          />
        }
        ListEmptyComponent={
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.colors.surface },
            ]}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amountText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 12,
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
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
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
