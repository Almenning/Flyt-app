(() => {
  'use strict';
  const capacitor = window.Capacitor;
  const isNative = !!(capacitor && (
    typeof capacitor.isNativePlatform === 'function'
      ? capacitor.isNativePlatform()
      : capacitor.getPlatform?.() !== 'web'
  ));
  const platform = isNative ? capacitor.getPlatform?.() || 'native' : 'web';
  let appPlugin = null;

  function getAppPlugin() {
    if (!isNative || typeof capacitor?.registerPlugin !== 'function') return null;
    if (!appPlugin) appPlugin = capacitor.registerPlugin('App');
    return appPlugin;
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
    isNative,
    platform,
    addAppStateListener,
    getAppState,
  });
})();
