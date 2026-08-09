import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Canteen, JecnaAPI } from '@jzitnik/jecnaapi-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  HelperText,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleLogin = async (u?: string, p?: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const ok = await JecnaAPI.login(u ?? username, p ?? password);
      await Canteen.login(u ?? username, p ?? password);
      if (ok) {
        setSuccess(true);
        await SecureStore.setItemAsync('username', u ?? username);
        await SecureStore.setItemAsync('password', p ?? password);
        setError(null);
        router.replace('/');
      } else {
        setError('Uživatelské jméno nebo heslo není správné.');
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.centered}>
        <Text variant="titleLarge">Přihlášení úspěšné, přesměrovávám...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Surface style={styles.surface} elevation={4}>
        <Text variant="headlineMedium" style={styles.title}>
          Přihlášení
        </Text>
        <TextInput
          label="Uživatelské jméno"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={styles.input}
          mode="outlined"
          autoComplete="username"
          returnKeyType="next"
        />
        <TextInput
          label="Heslo"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          mode="outlined"
          autoComplete="password"
          returnKeyType="done"
        />
        {error && (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        )}
        <Button
          mode="contained"
          onPress={() => handleLogin()}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Přihlásit se
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    margin: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 24,
  },
  input: {
    width: 280,
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    width: 200,
  },
});
