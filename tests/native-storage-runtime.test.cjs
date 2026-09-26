const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const {storage,deferred}=require('./helpers/sync-harness.cjs');
const source=fs.readFileSync(path.join(__dirname,'../native-platform.js'),'utf8');
const token='sb-uopzveejnztbovncqbpq-auth-token';
const tick=()=>new Promise(r=>setImmediate(r));
function create(store=storage(),custom={},native=true){
 const items=new Map();const calls=[];
 const plugin={async get({key}){calls.push('get');return{value:items.get(key)??null}},async set({key,value}){calls.push('set');items.set(key,value)},async remove({key}){items.delete(key)},async clear(){calls.push('clear');items.clear()},...custom};
 const window={Capacitor:{isNativePlatform:()=>native,getPlatform:()=>native?'ios':'web',isPluginAvailable:()=>true,registerPlugin:()=>plugin}};
 vm.runInNewContext(source,{window,localStorage:store});return{api:window.FlytPlatform,store,items,calls};
}
test('native migration deletes legacy credentials only after a successful Keychain write',async()=>{
 const store=storage({[token]:'legacy'}),write=deferred(),h=create(store,{set:()=>write.promise});
 const migrating=h.api.secureAuthStorage.getItem(token);await tick();assert.equal(store.getItem(token),'legacy');
 write.resolve();assert.equal(await migrating,'legacy');assert.equal(store.getItem(token),null);
});
test('failed native migration preserves the old copy and never falls back to it',async()=>{
 const store=storage({[token]:'legacy'}),h=create(store,{set:async()=>{throw new Error('keychain locked')}});
 await assert.rejects(h.api.secureAuthStorage.getItem(token),/keychain locked/);assert.equal(store.getItem(token),'legacy');
});
test('late Keychain write is drained before clear; queued writes cannot run after logout',async()=>{
 const write=deferred();let h;
 h=create(storage(),{set:async({key,value})=>{await write.promise;h.items.set(key,value)}});
 const pending=h.api.secureAuthStorage.setItem(token,'secret');const rejection=assert.rejects(pending,/AUTH_STORAGE_LOCKED/);await tick();
 h.api.lockAuthStorage();const clearing=h.api.clearSecureAuthStorage();write.resolve();await rejection;await clearing;
 assert.equal(h.items.size,0);await assert.rejects(h.api.secureAuthStorage.setItem(token,'late'),/AUTH_STORAGE_LOCKED/);
 assert.equal(await h.api.secureAuthStorage.getItem(token),null);
});
test('Keychain clear rejection remains visible and the durable lock survives a new WebView',async()=>{
 const store=storage(),h=create(store,{clear:async()=>{throw new Error('locked')}});h.api.lockAuthStorage();
 await assert.rejects(h.api.clearSecureAuthStorage(),/locked/);
 const restarted=create(store);restarted.items.set(token,'old');assert.equal(await restarted.api.secureAuthStorage.getItem(token),null);assert.equal(restarted.calls.length,0);
});
test('a late migration read cannot return credentials after the session is locked',async()=>{
 const read=deferred(),h=create(storage({[token]:'legacy'}),{get:()=>read.promise});
 const pending=h.api.secureAuthStorage.getItem(token);const rejection=assert.rejects(pending,/AUTH_STORAGE_LOCKED/);await tick();
 h.api.lockAuthStorage();const clearing=h.api.clearSecureAuthStorage();read.resolve({value:'old-token'});await rejection;await clearing;
 assert.equal(h.store.getItem(token),null);
});
test('normal web storage keeps its namespace but refuses token writes after logout',()=>{
 const h=create(storage(),{},false);assert.equal(h.api.secureAuthStorage,null);
 h.api.webAuthStorage.setItem(token,'web');assert.equal(h.api.webAuthStorage.getItem(token),'web');
 h.api.lockAuthStorage();assert.equal(h.api.webAuthStorage.getItem(token),null);assert.throws(()=>h.api.webAuthStorage.setItem(token,'late'),/AUTH_STORAGE_LOCKED/);
 h.api.webAuthStorage.removeItem(token);h.api.unlockAuthStorage();h.api.webAuthStorage.setItem(token,'new');assert.equal(h.store.getItem(token),'new');
});
