import * as SecureStore from 'expo-secure-store';

/**
 * Supabase storage adapter for React Native.
 * Uses secure storage so auth tokens persist across launches.
 */
export const supabaseAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};

