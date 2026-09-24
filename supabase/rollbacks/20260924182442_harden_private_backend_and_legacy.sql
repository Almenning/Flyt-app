alter table private.beta_consents disable row level security;

grant select, insert, update, delete on table public.user_plans to authenticated;
grant select, insert, update, delete on table public.workout_sessions to authenticated;
grant select on table public.daily_status to authenticated;
grant select, insert, update on table public.relationships to authenticated;
grant select, insert, delete on table public.relationship_members to authenticated;
grant select, insert, delete on table public.relationship_invites to authenticated;
grant select, insert on table public.nudge_events to authenticated;
grant select, insert, update on table public.profile_cards to authenticated;
grant select, insert, update, delete on table public.custom_nudges to authenticated;
grant select, insert, update, delete on table public.partner_training_windows to authenticated;
grant select, insert on table public.partner_signals to authenticated;
