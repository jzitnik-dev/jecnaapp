import { useState } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Card, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { useSecureStore } from '@/hooks/useSecureStore';

const STORAGE_KEY = 'extraordinary_schedule_enabled';
const URL_STORAGE_KEY = 'extraordinary_schedule_custom_url';

export default function ExtraordinarySchedule() {
  const theme = useTheme();

  const [value, setValue, isLoadingStore] = useSecureStore<boolean>(
    STORAGE_KEY,
    {
      initialValue: false,
      parse: val => val === 'true',
      stringify: val => (val ? 'true' : 'false'),
    }
  );

  const [storedUrl, setStoredUrl, isLoadingUrl] = useSecureStore<string>(
    URL_STORAGE_KEY,
    {
      initialValue: '',
      parse: val => val,
      stringify: val => val,
    }
  );

  // 1. Change this to string OR undefined. No more useEffect!
  const [localUrl, setLocalUrl] = useState<string | undefined>(undefined);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text
            variant="titleLarge"
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            Mimořádný rozvrh
          </Text>

          <View style={styles.switchRow}>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurface }}
            >
              Zapnout funkci
            </Text>
            {isLoadingStore ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Switch value={value} onValueChange={setValue} />
            )}
          </View>

          {value && (
            <View style={styles.urlInputContainer}>
              <TextInput
                mode="outlined"
                label="Vlastní URL adresa (volitelné)"
                placeholder="např. https://moje-suplovani.cz"
                // 2. Fallback to storedUrl if the user hasn't typed anything yet
                value={localUrl ?? storedUrl}
                onChangeText={setLocalUrl}
                onBlur={() => {
                  // 3. Only save to SecureStore if the user actually typed something
                  if (localUrl !== undefined) {
                    setStoredUrl(localUrl);
                  }
                }}
                disabled={isLoadingUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginTop: 6,
                  marginBottom: 12,
                }}
              >
                Ponechte prázdné pro použití výchozího serveru. Změna se
                aplikuje po opuštění textového pole.
              </Text>
            </View>
          )}

          <Text
            variant="bodyMedium"
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Mimořádný rozvrh přímo ve stálém rozvrhu. Mimořádný rozvrh je přímo
            scrapovaný z online tabulky.&nbsp;
            <Text
              style={{
                color: theme.colors.onSurfaceVariant,
                fontWeight: '900',
              }}
            >
              Tabulka je scrapovaná na mém serveru, který běžím doma v malé
              vesnici u Ostravy, tak prosím nečekejte 100% uptime. Taky
              scrapovat Microsoft OneDrive tabulku není nejvíc stable věc.
            </Text>
          </Text>

          <Text
            variant="bodySmall"
            style={[styles.warningText, { color: theme.colors.error }]}
          >
            Tato funkce je experimentální a může být nestabilní. Tato funkce
            využívá data z mého serveru, backend tohoto serveru není opensource!
            Neručím za správnost dat.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 16, elevation: 2, borderRadius: 12 },
  title: { fontWeight: '700', marginBottom: 16 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  urlInputContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  warningText: { marginBottom: 16, fontWeight: '600' },
  description: { lineHeight: 22, marginBottom: 12 },
});
