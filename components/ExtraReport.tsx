import { useAccountInfo } from '@/hooks/useAccountInfo';
import { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import {
  Button,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';

export default function ExtraReport({
  modalVisible,
  setModalVisible,
  reportLocation,
}: {
  modalVisible: boolean;
  setModalVisible: (value: boolean) => void;
  reportLocation: 'TIMETABLE' | 'ABSENCES';
}) {
  const theme = useTheme();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { accountInfo } = useAccountInfo();

  const handleSend = async () => {
    if (!description.trim()) {
      setError('Popis chyby je povinný.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('https://jecnarozvrh.jzitnik.dev/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: reportLocation,
          content: description,
          class: accountInfo?.class,
        }),
      });

      if (!response.ok) {
        console.log(response);
        throw new Error('Nepodařilo se odeslat nahlášení.');
      }

      setSuccess(true);
      setDescription('');
      setTimeout(() => setModalVisible(false), 1500);
    } catch (err: any) {
      setError(err.message || 'Chyba při odesílání.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        contentContainerStyle={{
          margin: 20,
          padding: 20,
          borderRadius: 10,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Text
          style={{
            textAlign: 'center',
            fontSize: 25,
            color: theme.colors.onSurface,
          }}
        >
          Nahlásit chybu
        </Text>
        <Text
          style={{
            textAlign: 'center',
            fontSize: 14,
            color: theme.colors.onSurfaceVariant,
          }}
        >
          Nahlášení chyby parseru v mimořádném rozvrhu
        </Text>

        <Text style={{ marginTop: 8, marginBottom: 16 }}>
          Stručně vysvětlete, kde se v mimořádném rozvrhu nachází chyba. Jedná
          se o nahlášení chyby parseru nikoliv samotného obsahu mimořádného
          rozvrhu.
        </Text>

        <TextInput
          multiline
          placeholder="Popište chybu"
          value={description}
          onChangeText={setDescription}
          editable={!loading}
        />

        {error && <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text>}

        {success && (
          <Text style={{ color: 'green', marginTop: 8 }}>
            Nahlášení bylo odesláno!
          </Text>
        )}

        <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
          Při odeslání nahlášení chyby se zároveň se zprávou odešle Vaše třída a
          odkud jste chybu nahlásil/a.
        </Text>

        <TouchableOpacity disabled={loading} onPress={handleSend}>
          <Button mode="contained" style={{ marginTop: 8 }}>
            {loading ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              'Odeslat'
            )}
          </Button>
        </TouchableOpacity>
      </Modal>
    </Portal>
  );
}
