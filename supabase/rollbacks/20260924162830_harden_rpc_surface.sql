begin;

-- Restore the pre-migration compatibility surface if an older client must be
-- rolled back. Active client grants are unchanged by this rollback.
grant execute on function public.accept_beta_consent(text,text) to authenticated;
grant execute on function public.accept_relationship_invite(text) to authenticated;
grant execute on function public.get_household_status() to authenticated;
grant execute on function public.join_household(text) to authenticated;
grant execute on function public.mark_status_events_read() to authenticated;
grant execute on function public.save_my_flyt_state(jsonb) to authenticated;
grant execute on function public.save_my_status(text,text,text,text,text,text[]) to authenticated;
grant execute on function public.save_my_status(text,text,text,text,text,text[],boolean) to authenticated;
grant execute on function public.withdraw_beta_consent() to authenticated;
grant execute on function private.accept_relationship_invite_internal(text) to authenticated;

alter function public.accept_privacy_terms(text) set search_path = pg_catalog, public, private;
alter function public.accept_sensitive_consent(text) set search_path = pg_catalog, public, private;
alter function public.create_household(text) set search_path = pg_catalog, public, private;
alter function public.delete_my_account() set search_path = pg_catalog, public, private, auth;
alter function public.disconnect_partner() set search_path = pg_catalog, public, private;
alter function public.get_home_partner_context() set search_path = pg_catalog, public, private;
alter function public.get_my_beta_consent() set search_path = pg_catalog, private;
alter function public.get_my_flyt_context() set search_path = pg_catalog, public, private;
alter function public.get_oss_context() set search_path = pg_catalog, public, private;
alter function public.join_household_v2(text) set search_path = pg_catalog, public, private;
alter function public.mark_status_event_read(uuid) set search_path = public;
alter function public.rotate_household_invite() set search_path = pg_catalog, public, private;
alter function public.save_my_daily_status(text,text[],boolean) set search_path = pg_catalog, public, private;
alter function public.save_my_flyt_state_v2(jsonb,bigint) set search_path = pg_catalog, public, private;
alter function public.save_my_relationship_status(text,text,boolean) set search_path = pg_catalog, public, private;
alter function public.set_my_display_name(text) set search_path = public;
alter function public.submit_beta_feedback(text,text) set search_path = public;
alter function public.withdraw_sensitive_consent() set search_path = pg_catalog, public, private;

commit;
