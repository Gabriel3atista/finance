begin;

drop policy if exists household_invitations_create_by_member
  on public.household_invitations;

create policy household_invitations_create_by_owner
  on public.household_invitations for insert to authenticated
  with check (
    invited_by = (select auth.uid())
    and status = 'pending'
    and accepted_at is null
    and accepted_by is null
    and expires_at > (select now())
    and exists (
      select 1
      from public.household_members as member
      where member.household_id = household_invitations.household_id
        and member.user_id = (select auth.uid())
        and member.member_role = 'owner'
    )
  );

commit;
