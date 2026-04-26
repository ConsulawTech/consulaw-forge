-- Internal team messaging (project group chat + direct messages)
create table if not exists internal_messages (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade,
  sender_id    uuid references profiles(id) on delete set null,
  sender_name  text not null,
  recipient_id uuid references profiles(id) on delete set null,
  content      text not null,
  created_at   timestamptz default now()
);

-- Enable realtime for internal messages
alter publication supabase_realtime add table internal_messages;

-- RLS
alter table internal_messages enable row level security;

create policy "Team: full access to internal_messages"
  on internal_messages for all using (current_role_is('team'));
