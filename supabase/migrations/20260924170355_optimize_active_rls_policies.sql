-- Cache auth context once per statement without changing the applicable rows.
alter policy profiles_self_select on public.profiles
  using ((select auth.uid()) = id);

alter policy profiles_self_update on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy profiles_household_select on public.profiles
  using (
    exists (
      select 1
      from public.household_members me
      join public.household_members them on them.household_id = me.household_id
      where me.user_id = (select auth.uid())
        and them.user_id = profiles.id
    )
  );

alter policy household_member_select on public.households
  using (
    exists (
      select 1
      from public.household_members hm
      where hm.household_id = households.id
        and hm.user_id = (select auth.uid())
    )
  );

alter policy household_members_select on public.household_members
  using (
    exists (
      select 1
      from public.household_members me
      where me.household_id = household_members.household_id
        and me.user_id = (select auth.uid())
    )
  );

alter policy member_status_household_select on public.member_status
  using (
    exists (
      select 1
      from public.household_members hm
      where hm.household_id = member_status.household_id
        and hm.user_id = (select auth.uid())
    )
  );

alter policy member_status_self_insert on public.member_status
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.household_members hm
      where hm.household_id = member_status.household_id
        and hm.user_id = (select auth.uid())
    )
  );

alter policy member_status_self_update on public.member_status
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy beta_feedback_insert on public.beta_feedback
  with check (
    user_id = (select auth.uid())
    and (
      household_id is null
      or exists (
        select 1
        from public.household_members hm
        where hm.household_id = beta_feedback.household_id
          and hm.user_id = (select auth.uid())
      )
    )
  );

-- These two policies have the same role, command, and predicate as the
-- self policies above. Keeping one policy per rule avoids permissive OR work.
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
