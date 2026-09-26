(() => {
  'use strict';
  const VERSION = '20260926-native-keychain1';
  const LEGACY_SUPABASE_PREFIX = 'sb-uopzveejnztbovncqbpq-';
  const capacitor = window.Capacitor;
  const isNative = !!(capacitor && (
    typeof capacitor.isNativePlatform === 'function'
      ? capacitor.isNativePlatform()
      : capacitor.getPlatform?.() !== 'web'
  ));
  const platform = isNative ? capacitor.getPlatform?.() || 'native' : 'web';
  let appPlugin = null;
  let secureStoragePlugin = null;

  function getAppPlugin() {
    if (!isNative || typeof capacitor?.registerPlugin !== 'function') return null;
    if (!appPlugin) appPlugin = capacitor.registerPlugin('App');
    return appPlugin;
  }

  function getSecureStoragePlugin() {
    if (!isNative || typeof capacitor?.registerPlugin !== 'function') return null;
    if (typeof capacitor.isPluginAvailable === 'function' && !capacitor.isPluginAvailable('HverdagsOssSecureStorage')) {
      throw new Error('NATIVE_SECURE_STORAGE_UNAVAILABLE');
    }
    if (!secureStoragePlugin) secureStoragePlugin = capacitor.registerPlugin('HverdagsOssSecureStorage');
    return secureStoragePlugin;
  }

  function legacyValue(key) {
    if (!String(key).startsWith(LEGACY_SUPABASE_PREFIX)) return null;
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function removeLegacyValue(key) {
    if (!String(key).startsWith(LEGACY_SUPABASE_PREFIX)) return;
    try { localStorage.removeItem(key); } catch (_) {}
  }

  function clearLegacyAuthStorage() {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i) || '';
        if (key.startsWith(LEGACY_SUPABASE_PREFIX)) localStorage.removeItem(key);
      }
    } catch (_) {}
  }

  const secureAuthStorage = isNative ? Object.freeze({
    async getItem(key) {
      const plugin = getSecureStoragePlugin();
      if (!plugin) throw new Error('NATIVE_SECURE_STORAGE_UNAVAILABLE');
      const result = await plugin.get({ key });
      if (typeof result?.value === 'string') {
        removeLegacyValue(key);
        return result.value;
      }

      const legacy = legacyValue(key);
      if (legacy === null) return null;
      await plugin.set({ key, value: legacy });
      removeLegacyValue(key);
      return legacy;
    },
    async setItem(key, value) {
      const plugin = getSecureStoragePlugin();
      if (!plugin) throw new Error('NATIVE_SECURE_STORAGE_UNAVAILABLE');
      await plugin.set({ key, value: String(value) });
      removeLegacyValue(key);
    },
    async removeItem(key) {
      const plugin = getSecureStoragePlugin();
      if (!plugin) throw new Error('NATIVE_SECURE_STORAGE_UNAVAILABLE');
      await plugin.remove({ key });
      removeLegacyValue(key);
    },
  }) : null;

  async function clearSecureAuthStorage() {
    if (!isNative) return;
    const plugin = getSecureStoragePlugin();
    if (!plugin) throw new Error('NATIVE_SECURE_STORAGE_UNAVAILABLE');
    await plugin.clear();
    clearLegacyAuthStorage();
  }

  async function addAppStateListener(listener) {
    const plugin = getAppPlugin();
    if (!plugin?.addListener || typeof listener !== 'function') return null;
    return plugin.addListener('appStateChange', listener);
  }

  async function getAppState() {
    const plugin = getAppPlugin();
    if (!plugin?.getState) return { isActive: true };
    return plugin.getState();
  }

  window.FlytPlatform = Object.freeze({
    version: VERSION,
    isNative,
    platform,
    secureAuthStorage,
    clearSecureAuthStorage,
    addAppStateListener,
    getAppState,
  });
})();
