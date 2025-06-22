import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  HelperText,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import { SpseJecnaClient } from '../api/SpseJecnaClient';
import { useSpseJecnaClient } from '../hooks/useSpseJecnaClient';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkedStored, setCheckedStored] = useState(false);
  const router = useRouter();
  const setClient = useSpseJecnaClient(state => state.setClient);
  const setCookies = useSpseJecnaClient(state => state.setCookies);
  const client = new SpseJecnaClient();

  // Check for stored credentials on component mount
  useEffect(() => {
    const checkStoredCredentials = async () => {
      try {
        const storedUsername = await SecureStore.getItemAsync('username');
        const storedPassword = await SecureStore.getItemAsync('password');

        if (storedUsername && storedPassword) {
          // Try to login with stored credentials silently
          await handleLogin(storedUsername, storedPassword, true);
        }
      } catch (error) {
        console.error('Error checking stored credentials:', error);
      } finally {
        setCheckedStored(true);
      }
    };

    checkStoredCredentials();
  }, []);

  const handleLogin = async (u?: string, p?: string, silent?: boolean) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const ok = await client.login(u ?? username, p ?? password);
      if (ok) {
        setSuccess(true);
        await SecureStore.setItemAsync('username', u ?? username);
        await SecureStore.setItemAsync('password', p ?? password);
        setClient(client);
        setCookies(client.getCookies());
        router.replace('/(tabs)');
      } else {
        setError('Login failed. Check your credentials.');
        if (!silent) {
          await SecureStore.deleteItemAsync('username');
          await SecureStore.deleteItemAsync('password');
        }
      }
    } catch (e: any) {
      if (e.message == 'Login token not found') {
        await client.logout();
        await SecureStore.deleteItemAsync('username');
        await SecureStore.deleteItemAsync('password');
      }
      setError(e.message || 'Unknown error');
      if (!silent) {
        await SecureStore.deleteItemAsync('username');
        await SecureStore.deleteItemAsync('password');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!checkedStored) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.centered}>
        <Text variant="titleLarge">Login successful! Redirecting...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Surface style={styles.surface} elevation={4}>
        <Text variant="headlineMedium" style={styles.title}>
          Login
        </Text>
        <TextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={styles.input}
          mode="outlined"
          autoComplete="username"
          returnKeyType="next"
        />
        <TextInput
          label="Password"
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
          Login
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
