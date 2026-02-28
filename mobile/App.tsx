import 'react-native-url-polyfill/auto';

import { useEffect, useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { ConfigMissingScreen } from './src/screens/ConfigMissingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { getSupabase, isSupabaseConfigured } from './src/lib/supabase';

export default function App() {
  const Stack = useMemo(() => createNativeStackNavigator(), []);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
      return;
    }

    const supabase = getSupabase();

    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setReady(true));

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <>
        <ConfigMissingScreen />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0b1220' },
          headerTintColor: 'white',
        }}
      >
        {session ? (
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Cheap Atlanta Flights' }}
          />
        ) : (
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1220',
  },
});
