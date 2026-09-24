-- private.beta_consents is read and written only through authenticated
-- SECURITY DEFINER consent functions. RLS is defense in depth; no client
-- policies are intentionally created.
alter table private.beta_consents enable row level security;
revoke all privileges on table private.beta_consents from public, anon, authenticated;

-- These prototype tables are retained for historical data and account cleanup,
-- but the current production client uses the household/member_status RPC path.
revoke all privileges on table public.user_plans from public, anon, authenticated;
revoke all privileges on table public.workout_sessions from public, anon, authenticated;
revoke all privileges on table public.daily_status from public, anon, authenticated;
revoke all privileges on table public.relationships from public, anon, authenticated;
revoke all privileges on table public.relationship_members from public, anon, authenticated;
revoke all privileges on table public.relationship_invites from public, anon, authenticated;
revoke all privileges on table public.nudge_events from public, anon, authenticated;
revoke all privileges on table public.profile_cards from public, anon, authenticated;
revoke all privileges on table public.custom_nudges from public, anon, authenticated;
revoke all privileges on table public.partner_training_windows from public, anon, authenticated;
revoke all privileges on table public.partner_signals from public, anon, authenticated;

-- app_bundles and app_bundle_chunks already have no client grants. They remain
-- fail-closed and retain their historical data without a policy change.
