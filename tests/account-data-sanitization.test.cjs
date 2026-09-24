const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('logout uses a local Supabase signout and removes every private browser namespace',()=>{
  const sync=read('sync.js');
  assert.match(sync,/function clearPrivateLocalData\(\)/);
  assert.match(sync,/key\.startsWith\('flyt_state_v6:'\)/);
  assert.match(sync,/key\.startsWith\('hverdagsoss:private-tasks:'\)/);
  assert.match(sync,/key\.startsWith\('flyt\.summarySeen\.'\)/);
  assert.match(sync,/key\.startsWith\('flyt:daily-checkin-'\)/);
  assert.match(sync,/sb\.auth\.signOut\(\{scope:'local'\}\)/);
  assert.match(sync,/clearPrivateLocalData\(\);/);
});

test('authenticated state is never read from a device-wide legacy cache before identity is known',()=>{
  const index=read('index.html');
  assert.match(index,/const LEGACY_KEY='flyt_state_v5'/);
  assert.doesNotMatch(index,/localStorage\.getItem\(KEY\)/);
  assert.match(index,/flyt_state_v6:\$\{ctx\.user_id\}:\$\{ctx\.household\.id\}/);
  assert.match(index,/function privateStateKey\(\)/);
});

test('account removal and sensitive withdrawal remain explicit privacy operations',()=>{
  const account=read('account-ui.js');
  const sync=read('sync.js');
  assert.match(account,/withdraw_sensitive_consent/);
  assert.match(account,/delete_my_account/);
  assert.match(account,/window\.FlytSync\?\.logout\?\./);
  assert.match(sync,/memberIds/);
  assert.match(sync,/actorUserId/);
});

test('private task cache is keyed only by immutable user id',()=>{
  const personal=read('personal-tasks-ui.js');
  assert.match(personal,/ctx\?\.user_id\|\|'anonymous'/);
  assert.doesNotMatch(personal,/ctx\?\.user_id\|\|s\?\.user/);
});
