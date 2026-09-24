begin;

-- Prevent implicit execution through PostgreSQL's PUBLIC role. Client RPCs
-- are re-granted explicitly below; trigger/internal functions stay private.
revoke execute on all functions in schema public from public, anon, authenticated;

-- Active production client API.
grant execute on function public.accept_privacy_terms(text) to authenticated;
grant execute on function public.accept_sensitive_consent(text) to authenticated;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.disconnect_partner() to authenticated;
grant execute on function public.get_home_partner_context() to authenticated;
grant execute on function public.get_my_beta_consent() to authenticated;
grant execute on function public.get_my_flyt_context() to authenticated;
grant execute on function public.get_oss_context() to authenticated;
grant execute on function public.join_household_v2(text) to authenticated;
grant execute on function public.mark_status_event_read(uuid) to authenticated;
grant execute on function public.rotate_household_invite() to authenticated;
grant execute on function public.save_my_daily_status(text,text[],boolean) to authenticated;
grant execute on function public.save_my_flyt_state_v2(jsonb,bigint) to authenticated;
grant execute on function public.save_my_relationship_status(text,text,boolean) to authenticated;
grant execute on function public.set_my_display_name(text) to authenticated;
grant execute on function public.submit_beta_feedback(text,text) to authenticated;
grant execute on function public.withdraw_sensitive_consent() to authenticated;

-- Auth trigger, not a browser RPC.
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- SECURITY DEFINER functions resolve only explicitly qualified application
-- objects; pg_catalog remains implicitly available for built-ins.
alter function public.accept_privacy_terms(text) set search_path = '';
alter function public.accept_sensitive_consent(text) set search_path = '';
alter function public.create_household(text) set search_path = '';
alter function public.delete_my_account() set search_path = '';
alter function public.disconnect_partner() set search_path = '';
alter function public.get_home_partner_context() set search_path = '';
alter function public.get_my_beta_consent() set search_path = '';
alter function public.get_my_flyt_context() set search_path = '';
alter function public.get_oss_context() set search_path = '';
alter function public.join_household_v2(text) set search_path = '';
alter function public.mark_status_event_read(uuid) set search_path = '';
alter function public.rotate_household_invite() set search_path = '';
alter function public.save_my_daily_status(text,text[],boolean) set search_path = '';
alter function public.save_my_flyt_state_v2(jsonb,bigint) set search_path = '';
alter function public.save_my_relationship_status(text,text,boolean) set search_path = '';
alter function public.set_my_display_name(text) set search_path = '';
alter function public.submit_beta_feedback(text,text) set search_path = '';
alter function public.withdraw_sensitive_consent() set search_path = '';

-- This private implementation was reachable only through the unused legacy
-- relationship-invite wrapper. RLS policy helpers in private intentionally
-- retain authenticated EXECUTE because the policies call them directly.
revoke execute on function private.accept_relationship_invite_internal(text)
  from public, anon, authenticated;

commit;
