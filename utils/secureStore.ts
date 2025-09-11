import * as SecureStoreNative from 'expo-secure-store';
import { Store } from 'secure-webstore';

const isWeb = typeof window !== 'undefined';

// Unified storage interface
interface IStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const storage: IStorage = isWeb
  ? new (class implements IStorage {
      private store = new Store('myApp', 'encryptionKey');

      async getItem(key: string) {
        return await this.store.get(key);
      }

      async setItem(key: string, value: string) {
        await this.store.set(key, value);
      }

      async removeItem(key: string) {
        await this.store.del(key);
      }
    })()
  : new (class implements IStorage {
      async getItem(key: string) {
        return await SecureStoreNative.getItemAsync(key);
      }

      async setItem(key: string, value: string) {
        await SecureStoreNative.setItemAsync(key, value);
      }

      async removeItem(key: string) {
        await SecureStoreNative.deleteItemAsync(key);
      }
    })();

// Export unified functions
export const getItem = (key: string) => storage.getItem(key);
export const setItem = (key: string, value: string) => storage.setItem(key);
export const removeItem = (key: string) => storage.removeItem(key);
