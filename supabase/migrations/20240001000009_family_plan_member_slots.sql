alter table public.family_plans
add column if not exists member_slots jsonb not null default '[]'::jsonb;
