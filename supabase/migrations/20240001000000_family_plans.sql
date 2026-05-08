-- ============================================================
-- Grandma's Cookbook — Family Plan Architecture
-- Migration: 20240001000000_family_plans
-- ============================================================


-- ============================================================
-- 1. TABLES
-- ============================================================

create table public.family_plans (
    id              uuid        primary key default gen_random_uuid(),
    owner_user_id   uuid        not null references auth.users(id) on delete cascade,
    plan_status     text        not null default 'active'
                                check (plan_status in ('active', 'cancelled', 'expired')),
    max_members     int         not null default 6,
    created_at      timestamptz not null default now()
);

create table public.family_memberships (
    id              uuid        primary key default gen_random_uuid(),
    plan_id         uuid        not null references public.family_plans(id) on delete cascade,
    user_id         uuid        not null references auth.users(id) on delete cascade,
    role            text        not null default 'member'
                                check (role in ('owner', 'adult', 'member')),
    display_name    text        not null,
    invited_by      uuid        references auth.users(id) on delete set null,
    joined_at       timestamptz not null default now(),
    unique (plan_id, user_id)
);

create table public.family_invites (
    id              uuid        primary key default gen_random_uuid(),
    plan_id         uuid        not null references public.family_plans(id) on delete cascade,
    email           text        not null,
    role            text        not null default 'member'
                                check (role in ('adult', 'member')),
    invite_token    text        not null unique default encode(gen_random_bytes(32), 'hex'),
    status          text        not null default 'pending'
                                check (status in ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at      timestamptz not null default (now() + interval '7 days'),
    created_at      timestamptz not null default now()
);

create table public.recipes (
    id                  uuid        primary key default gen_random_uuid(),
    plan_id             uuid        not null references public.family_plans(id) on delete cascade,
    created_by_user_id  uuid        references auth.users(id) on delete set null,
    owner_membership_id uuid        references public.family_memberships(id) on delete set null,
    title               text        not null,
    content             jsonb,
    folder_slug         text,
    created_at          timestamptz not null default now()
);


-- ============================================================
-- 2. INDEXES (foreign keys not automatically indexed in Postgres)
-- ============================================================

create index on public.family_plans (owner_user_id);

create index on public.family_memberships (plan_id);
create index on public.family_memberships (user_id);
create index on public.family_memberships (invited_by);

create index on public.family_invites (plan_id);
create index on public.family_invites (invite_token);

create index on public.recipes (plan_id);
create index on public.recipes (created_by_user_id);
create index on public.recipes (owner_membership_id);


-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

alter table public.family_plans        enable row level security;
alter table public.family_memberships  enable row level security;
alter table public.family_invites      enable row level security;
alter table public.recipes             enable row level security;


-- ------------------------------------------------------------
-- family_plans policies
-- ------------------------------------------------------------

-- Owner can read their own plan
create policy "family_plans: owner can read"
    on public.family_plans
    for select
    using (owner_user_id = auth.uid());

-- Members can read the plan they belong to
create policy "family_plans: member can read"
    on public.family_plans
    for select
    using (
        exists (
            select 1
            from public.family_memberships fm
            where fm.plan_id = id
              and fm.user_id = auth.uid()
        )
    );

-- Owner can update their own plan
create policy "family_plans: owner can update"
    on public.family_plans
    for update
    using (owner_user_id = auth.uid());


-- ------------------------------------------------------------
-- family_memberships policies
-- ------------------------------------------------------------

-- Any plan member can read all memberships on their shared plan
create policy "family_memberships: members can read"
    on public.family_memberships
    for select
    using (
        exists (
            select 1
            from public.family_memberships self
            where self.plan_id = plan_id
              and self.user_id = auth.uid()
        )
    );

-- Only the plan owner can insert memberships
create policy "family_memberships: owner can insert"
    on public.family_memberships
    for insert
    with check (
        exists (
            select 1
            from public.family_plans fp
            where fp.id = plan_id
              and fp.owner_user_id = auth.uid()
        )
    );

-- Only the plan owner can delete memberships
create policy "family_memberships: owner can delete"
    on public.family_memberships
    for delete
    using (
        exists (
            select 1
            from public.family_plans fp
            where fp.id = plan_id
              and fp.owner_user_id = auth.uid()
        )
    );


-- ------------------------------------------------------------
-- family_invites policies
-- ------------------------------------------------------------

-- Plan owner can create invites
create policy "family_invites: owner can insert"
    on public.family_invites
    for insert
    with check (
        exists (
            select 1
            from public.family_plans fp
            where fp.id = plan_id
              and fp.owner_user_id = auth.uid()
        )
    );

-- Plan owner can cancel invites (update status to 'cancelled')
create policy "family_invites: owner can update"
    on public.family_invites
    for update
    using (
        exists (
            select 1
            from public.family_plans fp
            where fp.id = plan_id
              and fp.owner_user_id = auth.uid()
        )
    );

-- Anyone who knows the invite_token can read that invite row (accept flow)
-- This is intentionally unauthenticated-friendly: the token IS the secret.
create policy "family_invites: token holder can read"
    on public.family_invites
    for select
    using (true);  -- filtered in application layer by invite_token; token is unguessable (32 random bytes)


-- ------------------------------------------------------------
-- recipes policies
-- ------------------------------------------------------------

-- All plan members can read recipes on their plan
create policy "recipes: members can read"
    on public.recipes
    for select
    using (
        exists (
            select 1
            from public.family_memberships fm
            where fm.plan_id = plan_id
              and fm.user_id = auth.uid()
        )
    );

-- Users can only insert recipes they own
create policy "recipes: creator can insert"
    on public.recipes
    for insert
    with check (
        created_by_user_id = auth.uid()
        and exists (
            select 1
            from public.family_memberships fm
            where fm.plan_id = plan_id
              and fm.user_id = auth.uid()
        )
    );

-- Users can only update their own recipes
create policy "recipes: creator can update"
    on public.recipes
    for update
    using (created_by_user_id = auth.uid());

-- Users can only delete their own recipes
create policy "recipes: creator can delete"
    on public.recipes
    for delete
    using (created_by_user_id = auth.uid());
