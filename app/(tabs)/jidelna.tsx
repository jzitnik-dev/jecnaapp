import { type CanteenMenuResult } from '@/api/iCanteenClient';
import { useSpseJecnaClient } from '@/hooks/useSpseJecnaClient';
import { useTheme } from 'react-native-paper';
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

function getStatusColor(type: 'přeobjednat' | 'objednat' | 'zrušit') {
  if (type === 'přeobjednat' || type === 'objednat') {
    return 'green';
  }
  if (type === 'zrušit') {
    return 'red';
  }
}

function getIcon(type: 'přeobjednat' | 'objednat' | 'zrušit') {
  if (type === 'zrušit') {
    return 'close-circle-outline';
  }
  if (type === 'objednat' || type === 'přeobjednat') {
    return 'cart-outline';
  }
}

export default function Jidelna() {
  const [menuData, setMenuData] = useState<CanteenMenuResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const [ordering, setOrdering] = useState<string | undefined>();

  const backgroundColor = theme.colors.background;
  const textColor = theme.colors.onBackground;
  const cardBackground = theme.colors.surface;

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchMenu();
  };

  useEffect(() => {
    fetchMenu();
  }, []);

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
              {menuItem.dayName} {menuItem.date}
            </Text>
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {menuItem.items.map(el => (
              <View
                key={el.name}
                style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 4,
                  paddingVertical: 15,
                  paddingHorizontal: 15,
                }}
              >
                {/* Food description */}
                <View style={styles.foodSection}>
                  <Text style={[styles.foodTitle, { color: textColor }]}>
                    Jídlo
                  </Text>
                  <Text style={[styles.foodDescription, { color: textColor }]}>
                    {el.name}
                  </Text>
                </View>

                {/* Price */}
                <View style={styles.priceSection}>
                  <Text style={[styles.priceText, { color: textColor }]}>
                    {el.price}
                  </Text>
                </View>

                {/* Allergens */}
                {el.allergens.length > 0 && (
                  <View style={styles.allergenSection}>
                    <Text style={[styles.allergenTitle, { color: textColor }]}>
                      Alergeny
                    </Text>
                    <View style={styles.allergenList}>
                      {el.allergens.map((allergen, index) => (
                        <View
                          key={index}
                          style={[
                            styles.allergenBadge,
                            {
                              backgroundColor:
                                allergenColors[allergen] || '#999',
                            },
                          ]}
                        >
                          <Text style={styles.allergenText}>{allergen}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {(el.pickupTime || el.orderDeadline || el.cancelDeadline) && (
                  <View style={styles.timingSection}>
                    <Ionicons name="time-outline" size={16} color={textColor} />
                    <View style={styles.timingInfo}>
                      {el.pickupTime && (
                        <Text style={[styles.timingText, { color: textColor }]}>
                          Výdej: {el.pickupTime}
                        </Text>
                      )}
                      {el.orderDeadline && (
                        <Text style={[styles.timingText, { color: textColor }]}>
                          Objednat do: {el.orderDeadline}
                        </Text>
                      )}
                      {el.cancelDeadline && (
                        <Text style={[styles.timingText, { color: textColor }]}>
                          Zrušit do: {el.cancelDeadline}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {!el.disabledAction && (
                  <TouchableOpacity
                    style={[
                      styles.orderButton,
                      {
                        backgroundColor: getStatusColor(el.buttonPresstype),
                        justifyContent:
                          ordering === el.name ? 'center' : 'flex-start',
                        opacity: ordering === el.name ? 0.7 : 1,
                      },
                    ]}
                    onPress={async () => {
                      setOrdering(el.name);
                      const canteenClient =
                        await spseClient?.getCanteenClient();
                      await canteenClient?.runAction(el);
                      await fetchMenu();
                      setOrdering(undefined);
                    }}
                    disabled={ordering !== undefined}
                  >
                    {ordering === el.name ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons
                          name={getIcon(el.buttonPresstype) as any}
                          size={20}
                          color="white"
                        />
                        <Text style={styles.orderButtonText}>
                          {el.buttonPresstype[0].toUpperCase() +
                            el.buttonPresstype.slice(1)}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
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
