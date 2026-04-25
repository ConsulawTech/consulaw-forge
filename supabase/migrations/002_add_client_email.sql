-- Add email column to clients table.
-- Clients are CRM records; no Supabase Auth account is created for them.
alter table clients
  add column if not exists email text;
