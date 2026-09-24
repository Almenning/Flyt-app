const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const migration=read('supabase/migrations/20260924170355_optimize_active_rls_policies.sql');
const rollback=read('supabase/rollbacks/20260924170355_optimize_active_rls_policies.sql');
const client=['sync.js','account-ui.js','home-ui.js','oss.js','daily-checkin-popup.js','status-alert-ui.js','beta-ui.js','nudge-ui.js'].map(read).join('\n');

test('active RLS policy migration caches auth uid and only removes duplicate profile rules',()=>{
  for(const policy of [
    'profiles_self_select','profiles_self_update','profiles_household_select',
    'household_member_select','household_members_select',
    'member_status_household_select','member_status_self_insert',
    'member_status_self_update','beta_feedback_insert'
  ])assert.match(migration,new RegExp(`alter policy ${policy} on public\\.`, 'i'));

  assert.match(migration,/\(select auth\.uid\(\)\)/i);
  assert.match(migration,/drop policy if exists profiles_select_own on public\.profiles/i);
  assert.match(migration,/drop policy if exists profiles_update_own on public\.profiles/i);
  assert.doesNotMatch(migration,/drop policy[^;]+profiles_household_select/i);
  assert.match(rollback,/create policy profiles_select_own/i);
  assert.match(rollback,/create policy profiles_update_own/i);
});

test('production client keeps status and feedback on the supported RPC surface',()=>{
  assert.doesNotMatch(client,/\.from\(['\"](?:profiles|households|household_members|member_status|beta_feedback)['\"]\)/);
  assert.match(client,/rpc\(['\"]save_my_daily_status['\"]/);
  assert.match(client,/rpc\(['\"]save_my_relationship_status['\"]/);
  assert.match(client,/rpc\(['\"]submit_beta_feedback['\"]/);
});
