-- Client Portal Upgrade: logo support

-- Add logo_url to clients table
alter table clients add column if not exists logo_url text;

-- Create client-logos bucket (idempotent)
insert into storage.buckets (id, name, public)
values ('client-logos', 'client-logos', true)
on conflict (id) do nothing;

-- Enable RLS on storage.objects (should already be enabled)
alter table storage.objects enable row level security;

-- Drop existing policies if they exist to avoid conflicts
do $$
begin
  -- Team full access policy
  begin
    drop policy if exists "Team: full access to client-logos" on storage.objects;
  exception when others then null;
  end;

  -- Client own logo policy
  begin
    drop policy if exists "Client: access own logo" on storage.objects;
  exception when others then null;
  end;
end $$;

-- Policy: Team members have full access to client-logos bucket
create policy "Team: full access to client-logos"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'client-logos'
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'team'
    )
  )
  with check (
    bucket_id = 'client-logos'
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'team'
    )
  );

-- Policy: Clients can access their own logo (uploaded by team, but clients can view)
create policy "Client: access own logo"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'client-logos'
    and exists (
      select 1 from clients
      where clients.profile_id = auth.uid()
      and storage.objects.name like clients.id || '/%'
    )
  );
