const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const scene=fs.readFileSync(path.join(root,'ios/App/App/SceneDelegate.swift'),'utf8');
const platform=fs.readFileSync(path.join(root,'native-platform.js'),'utf8');
const sync=fs.readFileSync(path.join(root,'sync.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert.match(scene,/import Security/);
assert.match(scene,/class HverdagsOssSecureStoragePlugin: CAPPlugin, CAPBridgedPlugin/);
assert.match(scene,/jsName = "HverdagsOssSecureStorage"/);
assert.match(scene,/kSecClassGenericPassword/);
assert.match(scene,/kSecAttrAccessibleWhenUnlockedThisDeviceOnly/);
assert.match(scene,/SecItemCopyMatching/);
assert.match(scene,/SecItemUpdate/);
assert.match(scene,/SecItemAdd/);
assert.match(scene,/SecItemDelete/);
assert.match(scene,/bridge\?\.registerPluginType\(HverdagsOssSecureStoragePlugin\.self\)/);
assert.match(scene,/rootViewController = HverdagsOssBridgeViewController\(\)/);

assert.match(platform,/const LEGACY_SUPABASE_PREFIX = 'sb-uopzveejnztbovncqbpq-'/);
assert.match(platform,/registerPlugin\('HverdagsOssSecureStorage'\)/);
assert.match(platform,/secureAuthStorage/);
assert.match(platform,/async getItem\(key\)/);
assert.match(platform,/async setItem\(key, value\)/);
assert.match(platform,/async removeItem\(key\)/);
assert.match(platform,/await plugin\.set\(\{ key, value: legacy \}\)/);
assert.match(platform,/removeLegacyValue\(key\)/);
assert.match(platform,/clearSecureAuthStorage/);

assert.match(sync,/const nativeRuntime=/);
assert.match(sync,/authOptions\.storage=window\.FlytPlatform\.secureAuthStorage/);
assert.match(sync,/if\(!window\.FlytPlatform\?\.secureAuthStorage\)/);
assert.match(sync,/await window\.FlytPlatform\.clearSecureAuthStorage\?\.\(\)/);
assert.match(sync,/version:SYNC_VERSION/);
assert.match(index,/native-platform\.js\?v=20260926-native-keychain1/);
assert.match(index,/sync\.js\?v=20260926-native-keychain1/);

assert.doesNotMatch(platform,/localStorage\.setItem\(key, String\(value\)\)/,'new native auth writes must not fall back to WebView localStorage');
assert.doesNotMatch(sync,/storage:localStorage/,'Supabase native auth must not be configured with WebView localStorage');

console.log('ok - native Supabase auth uses iOS Keychain with one-time legacy migration');
