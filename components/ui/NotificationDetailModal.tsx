import {
  Modal,
  Portal,
  Text,
  ActivityIndicator,
  useTheme,
  Button,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useSpseJecnaClient } from '@/hooks/useSpseJecnaClient';
import { StyleSheet } from 'react-native';
import { NotificationType } from 'jecnaapi-react-native/jecnaapi';

export default function NotificationDetailModal({
  notificationId,
  onClose,
}: {
  notificationId?: number;
  onClose: () => unknown;
}) {
  const { client } = useSpseJecnaClient();
  const { data, isFetching } = useQuery({
    queryKey: ['notification', notificationId],
    queryFn: async () => {
      if (!client) throw new Error('Client not available');
      return client.getNotification(notificationId || 0);
    },
    enabled: typeof notificationId === 'number',
  });
  const theme = useTheme();

  const notificationStrings = {
    GOOD: 'Pochvala',
    BAD: 'Důtka',
    INFORMATION: 'Sdělení',
  } satisfies Record<NotificationType, string>;

  return (
    <Portal>
      <Modal
        visible={!!notificationId}
        onDismiss={() => {
          onClose();
        }}
        contentContainerStyle={[
          styles.paperModalContent,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <Text variant="titleLarge" style={{ marginBottom: 8 }}>
          {data ? notificationStrings[data.notificationType] : 'Detail'}
        </Text>
        {isFetching && <ActivityIndicator style={{ marginVertical: 16 }} />}
        {data && (
          <>
            <Text>
              Typ:{' '}
              <Text style={{ fontWeight: 'bold' }}>
                {notificationStrings[data.notificationType]}
              </Text>
            </Text>
            <Text>
              Datum:{' '}
              <Text style={{ fontWeight: 'bold' }}>
                {data.date.toLocaleDateString('cs-CZ')}
              </Text>
            </Text>
            <Text>
              Sdělení:{' '}
              <Text style={{ fontWeight: 'bold' }}>{data.message}</Text>
            </Text>
          </>
        )}
        <Button
          mode="contained"
          onPress={() => onClose()}
          style={{ marginTop: 16 }}
        >
          Zavřít
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  paperModalContent: {
    borderRadius: 16,
    padding: 24,
    minWidth: 260,
    maxWidth: 340,
    alignSelf: 'center',
    alignItems: 'flex-start',
  },
});
