-- ============================================================
-- Remove "adult" role — everyone non-owner is just "member"
-- ============================================================

-- Migrate any existing adult rows before dropping the constraint
update public.family_memberships set role = 'member' where role = 'adult';
update public.family_invites     set role = 'member' where role = 'adult';

-- Re-create check constraints without 'adult'
alter table public.family_memberships
    drop constraint if exists family_memberships_role_check;
alter table public.family_memberships
    add constraint family_memberships_role_check
    check (role in ('owner', 'member'));

alter table public.family_invites
    drop constraint if exists family_invites_role_check;
alter table public.family_invites
    add constraint family_invites_role_check
    check (role in ('member'));
