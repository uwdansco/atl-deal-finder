import { StyleSheet, Text, View } from 'react-native';

export function ConfigMissingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mobile app is almost ready</Text>
      <Text style={styles.body}>
        Set these environment variables before starting Expo:
      </Text>
      <View style={styles.codeBlock}>
        <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL=...</Text>
        <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_ANON_KEY=...</Text>
      </View>
      <Text style={styles.body}>
        Then run: <Text style={styles.codeInline}>npm run start</Text>
      </Text>
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
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 12,
    lineHeight: 20,
  },
  codeBlock: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#111b30',
    borderWidth: 1,
    borderColor: '#223256',
    marginBottom: 12,
  },
  code: {
    fontFamily: 'monospace',
    color: '#e2e8f0',
    marginBottom: 6,
  },
  codeInline: {
    fontFamily: 'monospace',
    color: '#e2e8f0',
  },
});

