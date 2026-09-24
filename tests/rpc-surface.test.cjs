const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const client=['sync.js','account-ui.js','home-ui.js','oss.js','daily-checkin-popup.js','status-alert-ui.js','beta-ui.js','nudge-ui.js'].map(read).join('\n');
const migration=read('supabase/migrations/20260924162830_harden_rpc_surface.sql');
const index=read('index.html');
const serviceWorker=read('sw.js');

const legacy=[
  'accept_beta_consent','accept_relationship_invite','get_household_status',
  'join_household','mark_status_events_read','save_my_flyt_state',
  'save_my_status','withdraw_beta_consent'
];

test('production client does not call revoked legacy RPCs',()=>{
  for(const name of legacy){
    const call=new RegExp(`(?:rpc|\\.rpc)\\(\\s*['\"]${name}['\"]`);
    assert.doesNotMatch(client,call,`${name} must not be called by the production client`);
  }
  assert.match(client,/rpc\(['"]join_household_v2['"]/);
  assert.match(client,/rpc\(['"]save_my_flyt_state_v2['"]/);
  assert.match(client,/rpc\(['"]get_oss_context['"]/);
});

test('migration uses an explicit authenticated allowlist and no anon grants',()=>{
  assert.match(migration,/revoke execute on all functions in schema public from public, anon, authenticated/i);
  assert.doesNotMatch(migration,/grant execute[^;]+to anon/i);
  for(const name of legacy)assert.doesNotMatch(migration,new RegExp(`grant execute on function public\\.${name}\\b[^;]*to authenticated`,'i'));
  assert.match(migration,/grant execute on function public\.save_my_flyt_state_v2\(jsonb,bigint\) to authenticated/i);
  assert.match(migration,/revoke execute on function private\.accept_relationship_invite_internal\(text\)[\s\S]+authenticated/i);
});

test('active SECURITY DEFINER client API uses an empty search path',()=>{
  for(const signature of [
    'accept_privacy_terms\\(text\\)','accept_sensitive_consent\\(text\\)',
    'create_household\\(text\\)','delete_my_account\\(\\)','disconnect_partner\\(\\)',
    'get_home_partner_context\\(\\)','get_my_beta_consent\\(\\)',
    'get_my_flyt_context\\(\\)','get_oss_context\\(\\)','join_household_v2\\(text\\)',
    'mark_status_event_read\\(uuid\\)','rotate_household_invite\\(\\)',
    'save_my_daily_status\\(text,text\\[\\],boolean\\)',
    'save_my_flyt_state_v2\\(jsonb,bigint\\)',
    'save_my_relationship_status\\(text,text,boolean\\)',
    'set_my_display_name\\(text\\)','submit_beta_feedback\\(text,text\\)',
    'withdraw_sensitive_consent\\(\\)'
  ])assert.match(migration,new RegExp(`alter function public\\.${signature} set search_path = ''`,'i'));
});

test('cache versions deliver the client RPC cleanup',()=>{
  assert.match(index,/oss\.js\?v=20260924-rpc-surface1/);
  assert.match(index,/hverdagsoss_sw_reset_v81/);
  assert.match(serviceWorker,/const CACHE='flyt-v81'/);
});
