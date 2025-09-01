import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { CanteenMenuResult } from '@/api/iCanteenClient';

interface CanteenProps {
  canteen?: CanteenMenuResult;
}

export function CanteenCard({ canteen }: CanteenProps) {
  const theme = useTheme();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysMenu = canteen?.menus.find(menu => {
    const [day, month, year] = menu.date.trim().split('.').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return parsedDate.getTime() === today.getTime();
  });

  const todaysOrder = todaysMenu?.items.find(food => food.ordered);

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
        {todaysOrder ? (
          <View
            key={todaysOrder.name}
            style={{
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 4,
              paddingVertical: 15,
              paddingHorizontal: 15,
            }}
          >
            <Text style={[styles.foodTitle, { color: theme.colors.onSurface }]}>
              Polévka
            </Text>
            <Text
              style={[
                styles.foodDescription,
                { color: theme.colors.onSurface },
              ]}
            >
              {todaysMenu?.polevka}
            </Text>

            <Text
              style={[
                styles.foodTitle,
                { color: theme.colors.onSurface, marginTop: 20 },
              ]}
            >
              Jídlo
            </Text>
            <Text
              style={[
                styles.foodDescription,
                { color: theme.colors.onSurface },
              ]}
            >
              {todaysOrder.name}
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
