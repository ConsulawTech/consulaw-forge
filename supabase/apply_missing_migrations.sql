-- Consolidated fix: apply all missing schema from migrations 003–007
-- Run this in your Supabase Dashboard → SQL Editor

-- ── 003: internal_messages table ──
create table if not exists internal_messages (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade,
  sender_id    uuid references profiles(id) on delete set null,
  sender_name  text not null,
  recipient_id uuid references profiles(id) on delete set null,
  content      text not null,
  created_at   timestamptz default now()
);

alter table internal_messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'internal_messages'
    and policyname = 'Team: full access to internal_messages'
  ) then
    create policy "Team: full access to internal_messages"
      on internal_messages for all using (current_role_is('team'));
  end if;
end $$;

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'internal_messages'
  ) then
    alter publication supabase_realtime add table internal_messages;
  end if;
end $$;

-- ── 005: clients.logo_url + storage bucket (bucket created via UI, see README) ──
alter table clients add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values ('client-logos', 'client-logos', true)
on conflict (id) do nothing;

-- ── 006: fix current_role_is helper + grants ──
create or replace function public.current_role_is(r text)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = r
  );
end;
$$ language plpgsql security definer;

grant execute on function public.current_role_is(text) to authenticated;
grant execute on function public.current_role_is(text) to anon;

-- ── 007: documents table + clients.updated_at ──
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects(id) on delete cascade not null,
  filename    text not null,
  file_url    text not null,
  file_type   text,
  file_size   int,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at  timestamptz default now()
);

alter table documents enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'documents'
    and policyname = 'Team: full access to documents'
  ) then
    create policy "Team: full access to documents"
      on documents for all using (current_role_is('team'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
    and tablename = 'documents'
    and policyname = 'Client: read own project documents'
  ) then
    create policy "Client: read own project documents"
      on documents for select using (project_id = client_project_id());
  end if;
end $$;

alter table clients add column if not exists updated_at timestamptz default now();

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_clients_updated_at on clients;
create trigger update_clients_updated_at before update on clients
  for each row execute function update_updated_at_column();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'documents'
  ) then
    alter publication supabase_realtime add table documents;
  end if;
end $$;
