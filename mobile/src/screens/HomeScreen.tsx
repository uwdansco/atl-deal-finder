import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getSupabase } from '../lib/supabase';

export function HomeScreen() {
  const supabase = useMemo(() => getSupabase(), []);
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) Alert.alert('Sign out failed', error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You’re signed in</Text>
      <Text style={styles.subtitle}>
        This is a native mobile shell. Next step is wiring your existing data
        screens (alerts, thresholds, history) into these routes.
      </Text>

      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={signOut}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Sign out</Text>
        )}
      </Pressable>
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
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 10,
    marginBottom: 18,
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: '800',
  },
});

