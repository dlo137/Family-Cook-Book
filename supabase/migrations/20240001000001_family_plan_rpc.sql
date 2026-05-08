-- ============================================================
-- Grandma's Cookbook — Family Plan RPC Functions
-- Migration: 20240001000001_family_plan_rpc
--
-- Replaces the two non-atomic multi-step operations in
-- familyPlanService.ts with single-transaction Postgres functions.
-- ============================================================


-- ============================================================
-- 1. create_family_plan
--
-- Atomically creates the family_plans row AND the owner's
-- family_memberships row. If either insert fails, both roll back.
--
-- Returns the new family_plans row.
-- ============================================================

create or replace function public.create_family_plan(
    p_owner_user_id uuid,
    p_display_name  text
)
returns public.family_plans
language plpgsql
security definer
set search_path = public
as $$
declare
    v_plan public.family_plans;
begin
    -- Insert the plan
    insert into public.family_plans (owner_user_id)
    values (p_owner_user_id)
    returning * into v_plan;

    -- Insert the owner membership in the same transaction
    insert into public.family_memberships (plan_id, user_id, role, display_name)
    values (v_plan.id, p_owner_user_id, 'owner', p_display_name);

    return v_plan;
end;
$$;


-- ============================================================
-- 2. accept_family_invite
--
-- Atomically validates the invite, inserts the membership row,
-- and marks the invite as accepted — all in one transaction.
--
-- Error codes returned in the message for the caller to handle:
--   INVITE_NOT_FOUND   — no row matches the token
--   INVITE_NOT_PENDING — invite status is not 'pending'
--   INVITE_EXPIRED     — invite has passed its expires_at
--   ALREADY_MEMBER     — user already has a membership on this plan
--
-- Returns the new family_memberships row.
-- ============================================================

create or replace function public.accept_family_invite(
    p_token        text,
    p_user_id      uuid,
    p_display_name text
)
returns public.family_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
    v_invite     public.family_invites;
    v_membership public.family_memberships;
begin
    -- Lock the invite row for update so concurrent accepts on the same
    -- token cannot both pass the pending check simultaneously.
    select * into v_invite
    from public.family_invites
    where invite_token = p_token
    for update;

    if not found then
        raise exception 'INVITE_NOT_FOUND'
            using hint = 'No invite exists for the provided token.';
    end if;

    if v_invite.status <> 'pending' then
        raise exception 'INVITE_NOT_PENDING'
            using hint = 'This invite has already been used or was cancelled.',
                  detail = v_invite.status;
    end if;

    if v_invite.expires_at < now() then
        raise exception 'INVITE_EXPIRED'
            using hint = 'This invite link has expired.',
                  detail = v_invite.expires_at::text;
    end if;

    -- Insert the membership (unique constraint on plan_id + user_id handles duplicates)
    begin
        insert into public.family_memberships (plan_id, user_id, role, display_name)
        values (v_invite.plan_id, p_user_id, v_invite.role, p_display_name)
        returning * into v_membership;
    exception
        when unique_violation then
            raise exception 'ALREADY_MEMBER'
                using hint = 'You are already a member of this family plan.';
    end;

    -- Mark invite as accepted in the same transaction
    update public.family_invites
    set status = 'accepted'
    where id = v_invite.id;

    return v_membership;
end;
$$;


-- ============================================================
-- Permissions
--
-- SECURITY DEFINER functions run as the function owner (postgres),
-- so authenticated users need explicit execute grants.
-- ============================================================

grant execute on function public.create_family_plan(uuid, text)            to authenticated;
grant execute on function public.accept_family_invite(text, uuid, text)    to authenticated;
