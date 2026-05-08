-- Allow members to update their own display_name
create policy "family_memberships: member can update own"
    on public.family_memberships
    for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
