-- ============================================================
-- Add relationship column to family_memberships
-- Migration: 20240001000008_membership_relationship
-- ============================================================

alter table public.family_memberships
    add column if not exists relationship text;

-- ============================================================
-- Update accept_family_invite RPC to accept p_relationship
-- ============================================================

create or replace function public.accept_family_invite(
    p_token        text,
    p_user_id      uuid,
    p_display_name text,
    p_relationship text default null
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
        insert into public.family_memberships (plan_id, user_id, role, display_name, relationship)
        values (v_invite.plan_id, p_user_id, v_invite.role, p_display_name, p_relationship)
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

grant execute on function public.accept_family_invite(text, uuid, text, text) to authenticated;
