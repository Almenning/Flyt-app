const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
const platform=fs.readFileSync(path.join(root,'native-platform.js'),'utf8');
const sync=fs.readFileSync(path.join(root,'sync.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const spm=fs.readFileSync(path.join(root,'ios/App/CapApp-SPM/Package.swift'),'utf8');

assert.equal(pkg.dependencies['@capacitor/app'],'^8.1.1');
assert.equal(lock.packages['node_modules/@capacitor/app']?.version,'8.1.1');
assert.match(spm,/package\(name: "CapacitorApp", path: "\.\.\/\.\.\/\.\.\/node_modules\/@capacitor\/app"\)/);
assert.match(spm,/product\(name: "CapacitorApp", package: "CapacitorApp"\)/);
assert.match(platform,/registerPlugin\('App'\)/);
assert.match(platform,/addListener\('appStateChange'/);
assert.match(platform,/plugin\.getState\(\)/);
assert.match(sync,/function stopPolling\(\)/);
assert.match(sync,/async function resumeAfterForeground\(\)/);
assert.match(sync,/async function handleNativeAppStateChange\(state\)/);
assert.match(sync,/sb\.auth\.stopAutoRefresh\?\.\(\)/);
assert.match(sync,/sb\.auth\.startAutoRefresh\?\.\(\)/);
assert.match(sync,/if\(dirty\)\{const saved=await retrySave\(\)/);
assert.match(sync,/await loadContext\(\)/);
assert.match(sync,/if\(!session\).*handleSessionLost/s);
assert.match(sync,/if\(bootstrapPromise\)return bootstrapPromise/);
assert.match(sync,/if\(foregroundSyncPromise\)return foregroundSyncPromise/);
assert.match(index,/native-platform\.js\?v=20260926-native-keychain1/);
assert.match(index,/sync\.js\?v=20260926-native-keychain1/);

console.log('ok - native lifecycle resumes auth and sync without duplicate refresh work');
