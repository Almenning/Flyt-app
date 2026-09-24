const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const migration=read('supabase/migrations/20260924182442_harden_private_backend_and_legacy.sql');
const rollback=read('supabase/rollbacks/20260924182442_harden_private_backend_and_legacy.sql');
const baseline=JSON.parse(read('docs/PRODUCTION-BACKEND-BASELINE.json'));
const client=['sync.js','account-ui.js','home-ui.js','oss.js','daily-checkin-popup.js','status-alert-ui.js','beta-ui.js','nudge-ui.js'].map(read).join('\n');

test('private consent store is fail-closed outside SECURITY DEFINER RPCs',()=>{
  assert.match(migration,/alter table private\.beta_consents enable row level security/i);
  assert.match(migration,/revoke all privileges on table private\.beta_consents from public, anon, authenticated/i);
  assert.doesNotMatch(migration,/create policy[^;]+beta_consents/i);
  assert.match(rollback,/alter table private\.beta_consents disable row level security/i);
});

test('legacy direct table grants are removed while account cleanup remains documented',()=>{
  for(const table of ['user_plans','workout_sessions','daily_status','relationships','relationship_members','relationship_invites','nudge_events','profile_cards','custom_nudges','partner_training_windows','partner_signals']){
    assert.match(migration,new RegExp(`revoke all privileges on table public\\.${table} from public, anon, authenticated`,'i'));
    assert.ok(baseline.legacy_tables_retained_without_client_grants[`public.${table}`]);
  }
});

test('current client has no direct legacy-table or Edge Function dependency',()=>{
  assert.doesNotMatch(client,/\.from\(['\"](?:user_plans|workout_sessions|daily_status|relationships|relationship_members|relationship_invites|nudge_events|profile_cards|custom_nudges|partner_training_windows|partner_signals|app_bundles|app_bundle_chunks)['\"]\)/);
  assert.doesNotMatch(client,/functions\.invoke\(['\"](?:tyvstart-beta|flyt-pilot|vercel-import-probe|xhtml-probe|flyt-sync)['\"]\)/);
  assert.deepEqual(baseline.edge_functions.production_required,[]);
});
