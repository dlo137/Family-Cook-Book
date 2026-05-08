-- ============================================================
-- Grant family members free access when they accept an invite.
--
-- Updates accept_family_invite to also upsert is_pro_version = true
-- on the new member's profile in the same transaction.
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
    -- Lock the invite row so concurrent accepts on the same token cannot
    -- both pass the pending check simultaneously.
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

    -- Insert the membership (unique constraint handles duplicates)
    begin
        insert into public.family_memberships (plan_id, user_id, role, display_name)
        values (v_invite.plan_id, p_user_id, v_invite.role, p_display_name)
        returning * into v_membership;
    exception
        when unique_violation then
            raise exception 'ALREADY_MEMBER'
                using hint = 'You are already a member of this family plan.';
    end;

    -- Mark invite accepted
    update public.family_invites
    set status = 'accepted'
    where id = v_invite.id;

    -- Grant free access: family members ride on the plan owner's subscription
    insert into public.profiles (id, is_pro_version, entitlement)
    values (p_user_id, true, 'family')
    on conflict (id) do update
        set is_pro_version = true,
            entitlement    = 'family';

    return v_membership;
end;
$$;

grant execute on function public.accept_family_invite(text, uuid, text) to authenticated;
