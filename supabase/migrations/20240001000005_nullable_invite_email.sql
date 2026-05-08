-- email is no longer required — invites are shared via native share sheet
alter table public.family_invites alter column email drop not null;
