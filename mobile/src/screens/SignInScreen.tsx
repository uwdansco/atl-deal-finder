import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getSupabase } from '../lib/supabase';

export function SignInScreen() {
  const supabase = useMemo(() => getSupabase(), []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) Alert.alert('Sign in failed', error.message);
    } finally {
      setBusy(false);
    }
  }

  async function signUp() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        Alert.alert('Sign up failed', error.message);
        return;
      }
      Alert.alert('Check your email', 'Confirm your email to finish signing up.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cheap Atlanta Flights</Text>
      <Text style={styles.subtitle}>Sign in to manage your alerts</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          editable={!busy}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="password"
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          editable={!busy}
        />

        <Pressable
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={signIn}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.buttonSecondary, busy && styles.buttonDisabled]}
          onPress={signUp}
          disabled={busy}
        >
          <Text style={styles.buttonSecondaryText}>Create account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#0b1220',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 6,
    marginBottom: 24,
  },
  form: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#111b30',
    borderWidth: 1,
    borderColor: '#223256',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#223256',
    backgroundColor: '#0b1220',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  button: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
  },
  buttonSecondary: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#223256',
  },
  buttonSecondaryText: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
});

