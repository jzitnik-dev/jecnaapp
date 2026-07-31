import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { MenuPage } from '@jzitnik/jecnaapi-react-native/canteen';
import Skeleton from '../ui/Skeleton';

interface CanteenProps {
  canteen?: MenuPage;
  isLoading?: boolean;
}

export function CanteenCard({
  canteen,
  isLoading: isLoadingProp,
}: CanteenProps) {
  const theme = useTheme();

  const isLoading = isLoadingProp ?? !canteen;

  const todaysOrder = useMemo(() => {
    if (!canteen?.menu?.menu) return undefined;

    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    const todaysMenu = Object.values(canteen.menu.menu).find(menu => {
      const menuDate = new Date(menu.day);
      return (
        menuDate.getDate() === todayDate &&
        menuDate.getMonth() === todayMonth &&
        menuDate.getFullYear() === todayYear
      );
    });

    return todaysMenu?.items.find(food => food.isOrdered);
  }, [canteen]);

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      elevation={3}
    >
      <Card.Content>
        <View style={styles.titleContainer}>
          <Ionicons
            name="restaurant-outline"
            size={24}
            color={theme.colors.onSurface}
            style={{ marginRight: 8 }}
          />
          <Text
            variant="titleLarge"
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            Dnešní jídlo
          </Text>
        </View>

        {isLoading ? (
          <View
            style={{
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 4,
              paddingVertical: 15,
              paddingHorizontal: 15,
            }}
          >
            <Skeleton
              style={{ width: 60, height: 16, marginBottom: 6 }}
              isDark={theme.dark}
            />
            <Skeleton
              style={{ width: '70%', height: 20 }}
              isDark={theme.dark}
            />

            <Skeleton
              style={{ width: 80, height: 16, marginTop: 20, marginBottom: 6 }}
              isDark={theme.dark}
            />
            <Skeleton
              style={{ width: '100%', height: 20, marginBottom: 6 }}
              isDark={theme.dark}
            />
            <Skeleton
              style={{ width: '85%', height: 20 }}
              isDark={theme.dark}
            />
          </View>
        ) : todaysOrder ? (
          <View
            key={todaysOrder.number}
            style={{
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 4,
              paddingVertical: 15,
              paddingHorizontal: 15,
            }}
          >
            {todaysOrder.description.soup && (
              <>
                <Text
                  style={[styles.foodTitle, { color: theme.colors.onSurface }]}
                >
                  Polévka
                </Text>
                <Text
                  style={[
                    styles.foodDescription,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {todaysOrder.description.soup}
                </Text>
              </>
            )}

            <Text
              style={[
                styles.foodTitle,
                {
                  color: theme.colors.onSurface,
                  marginTop: todaysOrder.description.soup ? 20 : 0,
                },
              ]}
            >
              Jídlo {todaysOrder.number}
            </Text>

            <Text
              style={[
                styles.foodDescription,
                { color: theme.colors.onSurface },
              ]}
            >
              {todaysOrder.description.rest}
            </Text>
          </View>
        ) : (
          <View style={[styles.emptyState]}>
            <Ionicons
              name="restaurant-outline"
              size={64}
              color={theme.colors.onSurface}
            />
            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
              Dnes nemáte objednané žádné jídlo
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
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
    textAlign: 'center',
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
});
