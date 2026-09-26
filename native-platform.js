(() => {
  'use strict';
  const capacitor = window.Capacitor;
  const isNative = !!(capacitor && (
    typeof capacitor.isNativePlatform === 'function'
      ? capacitor.isNativePlatform()
      : capacitor.getPlatform?.() !== 'web'
  ));
  window.FlytPlatform = Object.freeze({
    isNative,
    platform: isNative ? capacitor.getPlatform?.() || 'native' : 'web',
  });
})();
