-- ============================================================
-- Fix: infinite recursion in family_memberships RLS policy
--
-- The original "members can read" policy queried family_memberships
-- from within a family_memberships policy, causing Postgres to
-- re-evaluate the policy recursively until it errored.
--
-- Fix: a SECURITY DEFINER function reads the table as the definer
-- (bypassing RLS), so the policy check doesn't re-trigger itself.
-- ============================================================

-- Helper: check if the current user belongs to a given plan.
-- SECURITY DEFINER means it runs as the function owner (postgres),
-- bypassing RLS on family_memberships and breaking the recursion.
create or replace function public.is_family_plan_member(p_plan_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
    select exists (
        select 1
        from public.family_memberships
        where plan_id = p_plan_id
          and user_id = auth.uid()
    );
$$;

-- Drop the recursive policy
drop policy if exists "family_memberships: members can read" on public.family_memberships;

-- Replace it with one that calls the non-recursive helper
create policy "family_memberships: members can read"
    on public.family_memberships
    for select
    using (public.is_family_plan_member(plan_id));
