const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Historikk er permanent i Innstillinger uten egne synlighetsbrytere',()=>{
  const settings=read('settings-ui.js');
  assert.match(settings,/section\('Historikk'/);
  assert.match(settings,/Gjøre, Sett og Mål og belønning\./);
  assert.match(settings,/Historikken er alltid tilgjengelig her/);
  assert.match(settings,/openHistoryHub/);
  assert.doesNotMatch(settings,/history\.(tasks|seen|rewards)/);
});

test('samlet historikk gir innganger til Gjøre, Sett og Mål og belønning',()=>{
  const history=read('history-ui.js');
  for(const target of ['tasks','seen','rewards'])assert.match(history,new RegExp('data-history-hub="'+target+'"'));
  assert.match(history,/function openHistoryHub\(\)/);
  assert.match(history,/settingsHistoryMarkup/);
  assert.match(history,/back==='hub'/);
});

test('eksisterende historikksnarveier beholdes i hovedflatene',()=>{
  const seen=read('seen-ui.js'),rewards=read('rewards-ui.js');
  assert.match(seen,/data-seen-history='1'/);
  assert.match(rewards,/data-goal-history/);
  assert.match(seen,/settingsHistoryMarkup/);
  assert.match(rewards,/settingsHistoryMarkup/);
});

test('cache og loader peker på den nye historikkversjonen',()=>{
  const index=read('index.html'),watchdog=read('app-watchdog.js'),sw=read('sw.js');
  assert.match(index,/settings-ui\.js\?v=20261001-history-hub1/);
  assert.match(index,/seen-ui\.js\?v=20261001-settings-history1/);
  assert.match(index,/rewards-ui\.js\?v=20261001-settings-history1/);
  assert.match(watchdog,/history-ui\.js\?v=20261001-history-hub1/);
  assert.match(sw,/const CACHE='flyt-v100'/);
  assert.match(index,/hverdagsoss_sw_reset_v100/);
});
