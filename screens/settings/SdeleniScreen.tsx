import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { JecnaAPI } from '@jzitnik/jecnaapi-react-native';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Text, useTheme } from 'react-native-paper';
import NotificationDetailModal from '@/components/ui/NotificationDetailModal';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function SdeleniScreen() {
  const theme = useTheme();
  const { currentTheme: appTheme } = useAppTheme();
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    number | undefined
  >();

  const {
    data: notifications,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => JecnaAPI.getNotifications(),
  });

  const notificationStrings = {
    GOOD: 'Pochvala',
    BAD: 'Důtka',
    INFORMATION: 'Sdělení',
  } as const;

  const notificationColors = {
    GOOD: '#4CAF50',
    BAD: '#b50b0b',
    INFORMATION: '#3498db',
  } as const;

  const notificationIcons = {
    GOOD: 'star' as const,
    BAD: 'close-outline' as const,
    INFORMATION: 'information-circle' as const,
  } as const;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[styles.loadingText, { color: theme.colors.onBackground }]}
            >
              Načítání sdělení...
            </Text>
          </View>
        ) : notifications && notifications.length > 0 ? (
          <View style={styles.listContainer}>
            {notifications.map(notif => (
              <Card
                key={notif.recordId}
                style={[
                  styles.card,
                  { backgroundColor: appTheme.colors.surface },
                ]}
                onPress={() => setSelectedNotificationId(notif.recordId)}
              >
                <Card.Content style={styles.cardContent}>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: notificationColors[notif.type] },
                    ]}
                  >
                    <Ionicons
                      name={notificationIcons[notif.type]}
                      size={16}
                      color="white"
                    />
                    <Text style={styles.typeText}>
                      {notificationStrings[notif.type]}
                    </Text>
                  </View>
                  <Text
                    variant="bodyMedium"
                    style={{ color: appTheme.colors.onSurface }}
                    numberOfLines={2}
                  >
                    {notif.message}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        ) : (
          <View style={styles.centered}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.emptyText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Žádná sdělení
            </Text>
          </View>
        )}
      </ScrollView>

      <NotificationDetailModal
        notificationId={selectedNotificationId}
        onClose={() => setSelectedNotificationId(undefined)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 8,
    elevation: 2,
  },
  cardContent: {
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
