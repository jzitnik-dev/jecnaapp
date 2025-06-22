import {
  type CanteenMenuItem,
  type CanteenMenuResult,
} from '@/api/iCanteenClient';
import { useSpseJecnaClient } from '@/hooks/useSpseJecnaClient';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const allergenColors: { [key: string]: string } = {
  '1': '#FF6B6B', // Obiloviny - červená
  '2': '#4ECDC4', // Korýši - tyrkysová
  '3': '#45B7D1', // Vejce - modrá
  '4': '#96CEB4', // Ryby - zelená
  '5': '#FFEAA7', // Arašídy - žlutá
  '6': '#DDA0DD', // Sója - fialová
  '7': '#98D8C8', // Mléko - světle zelená
  '8': '#F7DC6F', // Ořechy - žlutá
  '9': '#BB8FCE', // Celer - fialová
  '10': '#F8C471', // Hořčice - oranžová
  '11': '#85C1E9', // Sezam - světle modrá
  '12': '#F1948A', // Oxid siřičitý - růžová
  '13': '#82E0AA', // Vlčí bob - světle zelená
  '14': '#F9E79F', // Měkkýši - světle žlutá
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

export default function Jidelna() {
  const [menuData, setMenuData] = useState<CanteenMenuResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ordering, setOrdering] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({}, 'background');

  const { client: spseClient } = useSpseJecnaClient();

  const fetchMenu = async () => {
    try {
      if (!spseClient) {
        throw new Error('SpseJecnaClient not available. Please login first.');
      }

      const canteenClient = await spseClient.getCanteenClient();
      const menu = await canteenClient.getMonthlyMenu();
      setMenuData(menu);
    } catch (error) {
      console.error('Error fetching menu:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Nepodařilo se načíst jídelníček';
      Alert.alert('Chyba', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOrder = async (menuItem: CanteenMenuItem) => {
    if (menuItem.status === 'disabled') {
      Alert.alert(
        'Nelze objednat',
        'Toto jídlo již nelze objednat nebo zrušit'
      );
      return;
    }

    setOrdering(menuItem.date);

    try {
      if (!spseClient) {
        throw new Error('SpseJecnaClient not available');
      }

      const canteenClient = await spseClient.getCanteenClient();

      // Use the actual ordering functionality
      const success = await canteenClient.toggleMealOrder(menuItem);

      if (success) {
        // Refresh the menu data to get updated information
        await fetchMenu();

        Alert.alert(
          'Úspěch',
          menuItem.status === 'ordered'
            ? 'Objednávka byla zrušena'
            : 'Jídlo bylo objednáno'
        );
      } else {
        Alert.alert('Chyba', 'Nepodařilo se zpracovat objednávku');
      }
    } catch (error) {
      console.error('Error ordering:', error);
      Alert.alert('Chyba', 'Nepodařilo se zpracovat objednávku');
    } finally {
      setOrdering(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMenu();
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ordered':
        return '#4CAF50';
      case 'disabled':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ordered':
        return 'Objednáno';
      case 'disabled':
        return 'Nelze zrušit';
      default:
        return 'Objednat';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ordered':
        return 'checkmark-circle';
      case 'disabled':
        return 'close-circle';
      default:
        return 'add-circle-outline';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color={textColor} />
        <Text style={[styles.loadingText, { color: textColor }]}>
          Načítání jídelníčku...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with credit and location */}
      <View style={[styles.header, { backgroundColor: cardBackground }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerItem}>
            <Ionicons name="wallet-outline" size={20} color={textColor} />
            <Text style={[styles.headerLabel, { color: textColor }]}>
              Kredit
            </Text>
            <Text style={[styles.headerValue, { color: textColor }]}>
              {menuData?.credit || '0,00 Kč'}
            </Text>
          </View>
          <View style={styles.headerItem}>
            <Ionicons name="location-outline" size={20} color={textColor} />
            <Text style={[styles.headerLabel, { color: textColor }]}>
              Výdejna
            </Text>
            <Text style={[styles.headerValue, { color: textColor }]}>
              {menuData?.pickupLocation || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu items */}
      {menuData?.menus.map(menuItem => (
        <View
          key={menuItem.date}
          style={[styles.menuCard, { backgroundColor: cardBackground }]}
        >
          {/* Date header */}
          <View style={styles.dateHeader}>
            <Text style={[styles.dateText, { color: textColor }]}>
              {menuItem.dayName}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(menuItem.status) },
              ]}
            >
              <Ionicons
                name={getStatusIcon(menuItem.status) as any}
                size={16}
                color="white"
              />
              <Text style={styles.statusText}>
                {getStatusText(menuItem.status)}
              </Text>
            </View>
          </View>

          {/* Food description */}
          {menuItem.food && (
            <View style={styles.foodSection}>
              <Text style={[styles.foodTitle, { color: textColor }]}>
                Jídlo
              </Text>
              <Text style={[styles.foodDescription, { color: textColor }]}>
                {menuItem.food}
              </Text>
            </View>
          )}

          {/* Price */}
          {menuItem.price && (
            <View style={styles.priceSection}>
              <Text style={[styles.priceText, { color: textColor }]}>
                {menuItem.price}
              </Text>
            </View>
          )}

          {/* Allergens */}
          {menuItem.allergens.length > 0 && (
            <View style={styles.allergenSection}>
              <Text style={[styles.allergenTitle, { color: textColor }]}>
                Alergeny
              </Text>
              <View style={styles.allergenList}>
                {menuItem.allergens.map((allergen, index) => (
                  <View
                    key={index}
                    style={[
                      styles.allergenBadge,
                      { backgroundColor: allergenColors[allergen] || '#999' },
                    ]}
                  >
                    <Text style={styles.allergenText}>{allergen}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Timing information */}
          {(menuItem.pickupTime ||
            menuItem.orderDeadline ||
            menuItem.cancelDeadline) && (
            <View style={styles.timingSection}>
              <Ionicons name="time-outline" size={16} color={textColor} />
              <View style={styles.timingInfo}>
                {menuItem.pickupTime && (
                  <Text style={[styles.timingText, { color: textColor }]}>
                    Výdej: {menuItem.pickupTime}
                  </Text>
                )}
                {menuItem.orderDeadline && (
                  <Text style={[styles.timingText, { color: textColor }]}>
                    Objednat do: {menuItem.orderDeadline}
                  </Text>
                )}
                {menuItem.cancelDeadline && (
                  <Text style={[styles.timingText, { color: textColor }]}>
                    Zrušit do: {menuItem.cancelDeadline}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Order button */}
          <TouchableOpacity
            style={[
              styles.orderButton,
              {
                backgroundColor: getStatusColor(menuItem.status),
                opacity: ordering === menuItem.date ? 0.7 : 1,
              },
            ]}
            onPress={() => handleOrder(menuItem)}
            disabled={
              menuItem.status === 'disabled' || ordering === menuItem.date
            }
          >
            {ordering === menuItem.date ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons
                  name={getStatusIcon(menuItem.status) as any}
                  size={20}
                  color="white"
                />
                <Text style={styles.orderButtonText}>
                  {getStatusText(menuItem.status)}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ))}

      {/* Empty state */}
      {(!menuData?.menus || menuData.menus.length === 0) && (
        <View style={[styles.emptyState, { backgroundColor: cardBackground }]}>
          <Ionicons name="restaurant-outline" size={64} color={textColor} />
          <Text style={[styles.emptyText, { color: textColor }]}>
            Žádné jídlo k dispozici
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
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
