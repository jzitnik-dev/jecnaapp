import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  HelperText,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import { SpseJecnaClient } from '../api/SpseJecnaClient';
import { useSpseJecnaClient } from '../hooks/useSpseJecnaClient';
import { removeItem, setItem } from '@/utils/secureStore';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const setClient = useSpseJecnaClient(state => state.setClient);
  const setCookies = useSpseJecnaClient(state => state.setCookies);
  const client = new SpseJecnaClient();

  const handleLogin = async (u?: string, p?: string, silent?: boolean) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const ok = await client.login(u ?? username, p ?? password);
      if (ok) {
        setSuccess(true);
        await setItem('username', u ?? username);
        await setItem('password', p ?? password);
        setClient(client);
        setCookies(client.getCookies());
        setError(null);
        router.replace('/(tabs)');
      } else {
        setError('Uživatelské jméno nebo heslo není správné.');
        if (!silent) {
          await removeItem('username');
          await removeItem('password');
        }
      }
    } catch (e: any) {
      if (e.message === 'Login token not found') {
        await client.logout();
        await removeItem('username');
        await removeItem('password');
      }
      setError(e.message || 'Unknown error');
      if (!silent) {
        await removeItem('username');
        await removeItem('password');
      }
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
