(() => {
  'use strict';
  const VERSION = '20260926-session-safety1';
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
  const AUTH_BLOCK_KEY = 'hverdagsoss:auth-blocked:v1';
  let storageEpoch = 0;
  let storageQueue = Promise.resolve();
  let authLocked = false;
  try { authLocked = localStorage.getItem(AUTH_BLOCK_KEY) === '1'; } catch (_) { authLocked = true; }
  function serializeStorage(action) {
    const work = storageQueue.then(action);
    storageQueue = work.catch(() => {});
    return work;
  }
  function assertStorageEpoch(epoch) {
    if (authLocked || epoch !== storageEpoch) throw new Error('AUTH_STORAGE_LOCKED');
  }
  function lockAuthStorage() {
    authLocked = true;
    storageEpoch++;
    localStorage.setItem(AUTH_BLOCK_KEY, '1');
  }
  function unlockAuthStorage() {
    localStorage.removeItem(AUTH_BLOCK_KEY);
    storageEpoch++;
    authLocked = false;
  }

  function getAppPlugin() {
    if (!isNative) return null;
    // The unbundled iOS app receives Plugins from Capacitor's injected bridge.
    // registerPlugin is also supported when the JavaScript core runtime is present.
    if (!appPlugin) appPlugin = capacitor.Plugins?.App || (
      typeof capacitor.registerPlugin === 'function' ? capacitor.registerPlugin('App') : null
    );
    if (!appPlugin) throw new Error('NATIVE_APP_PLUGIN_UNAVAILABLE');
    return appPlugin;
  }

  function getSecureStoragePlugin() {
    if (!isNative) return null;
    if (typeof capacitor.isPluginAvailable === 'function' && !capacitor.isPluginAvailable('HverdagsOssSecureStorage')) {
      throw new Error('NATIVE_SECURE_STORAGE_UNAVAILABLE');
    }
    if (!secureStoragePlugin) secureStoragePlugin = capacitor.Plugins?.HverdagsOssSecureStorage || (
      typeof capacitor.registerPlugin === 'function' ? capacitor.registerPlugin('HverdagsOssSecureStorage') : null
    );
    if (!secureStoragePlugin) throw new Error('NATIVE_SECURE_STORAGE_UNAVAILABLE');
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
      const epoch = storageEpoch;
      if (authLocked) return null;
      return serializeStorage(async () => {
        assertStorageEpoch(epoch);
        const plugin = getSecureStoragePlugin();
        if (!plugin) throw new Error('NATIVE_SECURE_STORAGE_UNAVAILABLE');
        const result = await plugin.get({ key });
        assertStorageEpoch(epoch);
        if (typeof result?.value === 'string') {
          removeLegacyValue(key);
          return result.value;
        }
        const legacy = legacyValue(key);
        if (legacy === null) return null;
        await plugin.set({ key, value: legacy });
        assertStorageEpoch(epoch);
        removeLegacyValue(key);
        return legacy;
      });
    },
    async setItem(key, value) {
      const epoch = storageEpoch;
      return serializeStorage(async () => {
        assertStorageEpoch(epoch);
        const plugin = getSecureStoragePlugin();
        if (!plugin) throw new Error('NATIVE_SECURE_STORAGE_UNAVAILABLE');
        await plugin.set({ key, value: String(value) });
        assertStorageEpoch(epoch);
        removeLegacyValue(key);
      });
    },
    async removeItem(key) {
      return serializeStorage(async () => {
        const plugin = getSecureStoragePlugin();
        if (!plugin) throw new Error('NATIVE_SECURE_STORAGE_UNAVAILABLE');
        await plugin.remove({ key });
        removeLegacyValue(key);
      });
    },
  }) : null;

  async function clearSecureAuthStorage() {
    if (!isNative) return;
    // A clear is ordered after any already-running Keychain write.
    return serializeStorage(async () => {
      const plugin = getSecureStoragePlugin();
      if (!plugin) throw new Error('NATIVE_SECURE_STORAGE_UNAVAILABLE');
      await plugin.clear();
      clearLegacyAuthStorage();
    });
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

  async function addUrlOpenListener(listener) {
    const plugin = getAppPlugin();
    if (!plugin?.addListener || typeof listener !== 'function') return null;
    return plugin.addListener('appUrlOpen', listener);
  }

  async function getLaunchUrl() {
    const plugin = getAppPlugin();
    if (!plugin?.getLaunchUrl) return null;
    const result = await plugin.getLaunchUrl();
    return result?.url || null;
  }

  const webAuthStorage = isNative ? null : Object.freeze({
    getItem(key) { return authLocked ? null : localStorage.getItem(key); },
    setItem(key, value) { assertStorageEpoch(storageEpoch); localStorage.setItem(key, String(value)); },
    removeItem(key) { localStorage.removeItem(key); },
  });

  window.FlytPlatform = Object.freeze({
    version: VERSION,
    isNative,
    platform,
    secureAuthStorage,
    webAuthStorage,
    clearSecureAuthStorage,
    lockAuthStorage,
    unlockAuthStorage,
    addAppStateListener,
    getAppState,
    addUrlOpenListener,
    getLaunchUrl,
  });
})();
