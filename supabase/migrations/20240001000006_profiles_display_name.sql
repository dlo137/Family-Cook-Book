-- Add display_name to profiles if it doesn't already exist
alter table public.profiles add column if not exists display_name text;
