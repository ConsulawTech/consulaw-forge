-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── PROFILES ──────────────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid references auth.users on delete cascade primary key,
  full_name     text not null,
  role          text not null check (role in ('team', 'client')),
  initials      text,
  avatar_color  text default '#1B3FEE',
  job_title     text,
  created_at    timestamptz default now()
);

-- Auto-create profile on sign up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── CLIENTS ───────────────────────────────────────────────────────────
create table if not exists clients (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  logo_letter  text,
  logo_color   text default '#e50914',
  profile_id   uuid references profiles(id) on delete set null,
  created_at   timestamptz default now()
);

-- ── PROJECTS ──────────────────────────────────────────────────────────
create table if not exists projects (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid references clients(id) on delete cascade not null,
  name              text not null,
  description       text,
  status            text default 'active',
  overall_progress  int default 0 check (overall_progress >= 0 and overall_progress <= 100),
  target_date       date,
  created_at        timestamptz default now()
);

-- ── PROJECT MEMBERS ───────────────────────────────────────────────────
create table if not exists project_members (
  project_id  uuid references projects(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete cascade,
  primary key (project_id, profile_id)
);

-- ── MILESTONES ────────────────────────────────────────────────────────
create table if not exists milestones (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade not null,
  title        text not null,
  description  text,
  deadline     date,
  progress     int default 0 check (progress >= 0 and progress <= 100),
  color        text default '#1B3FEE',
  order_index  int default 0,
  created_at   timestamptz default now()
);

-- ── TASKS ─────────────────────────────────────────────────────────────
create table if not exists tasks (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects(id) on delete cascade not null,
  milestone_id  uuid references milestones(id) on delete set null,
  title         text not null,
  assignee_id   uuid references profiles(id) on delete set null,
  status        text default 'todo' check (status in ('todo','in_progress','done','late')),
  due_date      timestamptz,
  created_at    timestamptz default now()
);

-- ── UPDATES ───────────────────────────────────────────────────────────
create table if not exists updates (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects(id) on delete cascade not null,
  title       text not null,
  color       text default '#1B3FEE',
  created_at  timestamptz default now()
);

-- ── MESSAGES ──────────────────────────────────────────────────────────
create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade not null,
  sender_id    uuid references profiles(id) on delete set null,
  sender_name  text not null,
  sender_role  text not null check (sender_role in ('team', 'client')),
  content      text not null,
  created_at   timestamptz default now()
);

-- Enable Realtime for messages
alter publication supabase_realtime add table messages;

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────
alter table profiles       enable row level security;
alter table clients        enable row level security;
alter table projects       enable row level security;
alter table project_members enable row level security;
alter table milestones     enable row level security;
alter table tasks          enable row level security;
alter table updates        enable row level security;
alter table messages       enable row level security;

-- Helper: get current user's role
create or replace function current_role_is(r text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = r
  );
$$;

-- Helper: get project_id for the current client
create or replace function client_project_id()
returns uuid language sql security definer stable as $$
  select p.id from projects p
  join clients c on c.id = p.client_id
  where c.profile_id = auth.uid()
  limit 1;
$$;

-- PROFILES policies
create policy "Team: full access to profiles" on profiles
  for all using (current_role_is('team'));
create policy "Client: read own profile" on profiles
  for select using (auth.uid() = id);

-- CLIENTS policies
create policy "Team: full access to clients" on clients
  for all using (current_role_is('team'));
create policy "Client: read own client" on clients
  for select using (profile_id = auth.uid());

-- PROJECTS policies
create policy "Team: full access to projects" on projects
  for all using (current_role_is('team'));
create policy "Client: read own project" on projects
  for select using (id = client_project_id());

-- PROJECT_MEMBERS policies
create policy "Team: full access to project_members" on project_members
  for all using (current_role_is('team'));
create policy "Client: read own project members" on project_members
  for select using (project_id = client_project_id());

-- MILESTONES policies
create policy "Team: full access to milestones" on milestones
  for all using (current_role_is('team'));
create policy "Client: read own milestones" on milestones
  for select using (project_id = client_project_id());

-- TASKS policies
create policy "Team: full access to tasks" on tasks
  for all using (current_role_is('team'));
create policy "Client: read own tasks" on tasks
  for select using (project_id = client_project_id());

-- UPDATES policies
create policy "Team: full access to updates" on updates
  for all using (current_role_is('team'));
create policy "Client: read own updates" on updates
  for select using (project_id = client_project_id());

-- MESSAGES policies
create policy "Team: full access to messages" on messages
  for all using (current_role_is('team'));
create policy "Client: read own messages" on messages
  for select using (project_id = client_project_id());
create policy "Client: insert own messages" on messages
  for insert with check (project_id = client_project_id() and sender_id = auth.uid());

-- ── SEED DATA ─────────────────────────────────────────────────────────
-- Run this section manually or via a separate seed.sql file after setting up auth users.
-- See seed.sql for sample data.
