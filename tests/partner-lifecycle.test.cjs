const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('partner disconnect is explicit, destructive only to shared data, and support is reachable',()=>{
  const account=read('account-ui.js');
  assert.match(account,/Koble fra partner/);
  assert.match(account,/Skriv KOBLE FRA for å bekrefte/);
  assert.match(account,/gjoeremal|gjøremål/i);
  assert.match(account,/historikk, poeng, meldinger og anerkjennelser slettes permanent/);
  assert.match(account,/Kontoene beholdes/);
  assert.match(account,/rpc\('disconnect_partner'/);
  assert.match(account,/clearLocalState\(\)/);
  assert.match(account,/Få hjelp med partnerkoblingen/);
  assert.match(account,/FlytBetaUI\?\.open/);
});

test('invite flow uses expiring rotatable codes and the rate-limited server endpoint',()=>{
  const sync=read('sync.js');
  assert.match(sync,/maxlength="12"/);
  assert.match(sync,/utløper automatisk etter sju dager/);
  assert.match(sync,/Lag ny invitasjonskode/);
  assert.match(sync,/rpc\('rotate_household_invite'/);
  assert.match(sync,/rpc\('join_household_v2'/);
  assert.match(sync,/For mange forsøk\. Vent litt/);
  assert.match(sync,/Koden er ugyldig eller har utløpt/);
  assert.match(sync,/handleDisconnected/);
  assert.match(sync,/clearPrivateLocalData/);
});

test('privacy text defines the shared-data outcome before production use',()=>{
  const privacy=read('privacy.html');
  assert.match(privacy,/Hvis dere kobler fra/);
  assert.match(privacy,/slettes permanent for begge/);
  assert.match(privacy,/Begge kontoene beholdes/);
  assert.match(privacy,/utløper etter sju dager/);
  assert.match(privacy,/kodeforsøk begrenses på serveren/);
});
