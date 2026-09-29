const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../native-platform.js'), 'utf8');

function harness({ bundled = false, available = true, web = false } = {}) {
  const values = new Map(), local = new Map(), events = [], registrations = [];
  const secure = {
    get: async ({ key }) => ({ value: values.get(key) ?? null }),
    set: async ({ key, value }) => { values.set(key, value); },
    remove: async ({ key }) => { values.delete(key); },
    clear: async () => { values.clear(); }
  };
  const app = {
    getState: async () => ({ isActive: false }),
    getLaunchUrl: async () => ({ url: 'hverdagsoss://invite/ABCDEF123456' }),
    addListener(event, callback) { events.push({ event, callback }); return { remove: async () => {} }; }
  };
  const plugins = available ? { App: app, HverdagsOssSecureStorage: secure } : {};
  const capacitor = {
    isNativePlatform: () => !web,
    getPlatform: () => web ? 'web' : 'ios',
    isPluginAvailable: name => Object.hasOwn(plugins, name)
  };
  if (bundled) capacitor.registerPlugin = name => { registrations.push(name); return plugins[name]; };
  else capacitor.Plugins = plugins;
  const window = { Capacitor: capacitor };
  vm.runInNewContext(source, {
    window,
    localStorage: {
      getItem: key => local.get(key) ?? null,
      setItem: (key, value) => local.set(key, String(value)),
      removeItem: key => local.delete(key),
      key: index => [...local.keys()][index] ?? null,
      get length() { return local.size; }
    }
  });
  return { api: window.FlytPlatform, values, local, events, registrations };
}

test('unbundled Capacitor injected Plugins supports Keychain and App without registerPlugin', async () => {
  const h = harness();
  await h.api.secureAuthStorage.setItem('native-test', 'synthetic-value');
  assert.equal(await h.api.secureAuthStorage.getItem('native-test'), 'synthetic-value');
  assert.equal(h.local.has('native-test'), false);
  assert.equal((await h.api.getAppState()).isActive, false);
  assert.equal(await h.api.getLaunchUrl(), 'hverdagsoss://invite/ABCDEF123456');
  let callback;
  await h.api.addUrlOpenListener(event => { callback = event.url; });
  await h.api.addAppStateListener(() => {});
  assert.deepEqual(h.events.map(item => item.event), ['appUrlOpen', 'appStateChange']);
  h.events[0].callback({ url: 'hverdagsoss://invite/123456ABCDEF' });
  assert.equal(callback, 'hverdagsoss://invite/123456ABCDEF');
  await h.api.secureAuthStorage.removeItem('native-test');
  assert.equal(await h.api.secureAuthStorage.getItem('native-test'), null);
});

test('bundled JavaScript registerPlugin remains supported and is cached per plugin', async () => {
  const h = harness({ bundled: true });
  await h.api.secureAuthStorage.setItem('native-test', 'synthetic-value');
  await h.api.secureAuthStorage.getItem('native-test');
  await h.api.getAppState(); await h.api.getAppState();
  assert.deepEqual(h.registrations, ['HverdagsOssSecureStorage', 'App']);
});

test('missing native plugins reject rather than pretending secure storage or lifecycle is working', async () => {
  const h = harness({ available: false });
  await assert.rejects(h.api.secureAuthStorage.getItem('native-test'), /NATIVE_SECURE_STORAGE_UNAVAILABLE/);
  await assert.rejects(h.api.getAppState(), /NATIVE_APP_PLUGIN_UNAVAILABLE/);
  assert.equal(h.local.has('native-test'), false);
});

test('web still uses its existing storage without requiring any native plugin', async () => {
  const h = harness({ web: true, available: false });
  assert.equal(h.api.secureAuthStorage, null);
  h.api.webAuthStorage.setItem('web-test', 'synthetic-value');
  assert.equal(h.api.webAuthStorage.getItem('web-test'), 'synthetic-value');
  assert.equal((await h.api.getAppState()).isActive, true);
  assert.equal(await h.api.getLaunchUrl(), null);
});
