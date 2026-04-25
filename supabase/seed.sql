-- ── SEED DATA (run after creating auth users via Supabase dashboard) ──
-- Replace UUIDs with real user IDs from your Supabase auth.users table

-- Team members (update IDs to match your auth users)
insert into profiles (id, full_name, role, initials, avatar_color, job_title) values
  ('00000000-0000-0000-0000-000000000001', 'Jamaal Fashola',  'team', 'JF', '#1B3FEE', 'Project Lead'),
  ('00000000-0000-0000-0000-000000000002', 'Naomi Okafor',   'team', 'NO', '#10b981', 'Frontend Dev'),
  ('00000000-0000-0000-0000-000000000003', 'Khalil Hassan',  'team', 'KH', '#8b5cf6', 'Product Manager'),
  ('00000000-0000-0000-0000-000000000004', 'Herald Diaz',    'team', 'HD', '#f59f00', 'QA Engineer'),
  ('00000000-0000-0000-0000-000000000005', 'Netflix Team',   'client', 'NT', '#e50914', 'Client')
on conflict (id) do nothing;

-- Client
insert into clients (id, name, logo_letter, logo_color, profile_id) values
  ('10000000-0000-0000-0000-000000000001', 'Netflix', 'N', '#e50914', '00000000-0000-0000-0000-000000000005')
on conflict (id) do nothing;

-- Project
insert into projects (id, client_id, name, description, status, overall_progress, target_date) values
  ('20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   'Website Redesign',
   'Full redesign of Netflix web interface to improve user engagement, content discovery, and streamlined navigation across devices.',
   'active', 65, '2026-06-30')
on conflict (id) do nothing;

-- Project members
insert into project_members (project_id, profile_id) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004')
on conflict do nothing;

-- Milestones
insert into milestones (id, project_id, title, description, deadline, progress, color, order_index) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   'Design Phase', 'Establish visual direction and user experience for the website.', '2025-06-11', 23, '#1B3FEE', 0),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
   'Full Development', 'Translate approved designs into functional code.', '2025-06-23', 25, '#8b5cf6', 1),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001',
   'Testing & QA', 'Ensure reliable performance across devices and browsers.', '2025-06-28', 10, '#f59f00', 2),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001',
   'Launch Readiness', 'Prepare the website for public release.', '2025-06-29', 10, '#10b981', 3)
on conflict (id) do nothing;

-- Tasks
insert into tasks (project_id, milestone_id, title, assignee_id, status, due_date) values
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
   'Design Home Page', '00000000-0000-0000-0000-000000000001', 'in_progress', now() + interval '1 day'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
   'Review Wireframes with PM', '00000000-0000-0000-0000-000000000003', 'todo', now() + interval '3 days'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002',
   'Build Nav & Footer in Code', '00000000-0000-0000-0000-000000000002', 'todo', now() + interval '5 days'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003',
   'QA Test and Deployment Setup', '00000000-0000-0000-0000-000000000004', 'todo', now() + interval '6 days'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
   'Revision Meeting with Client', '00000000-0000-0000-0000-000000000001', 'late', now() + interval '7 days');

-- Updates
insert into updates (project_id, title, color, created_at) values
  ('20000000-0000-0000-0000-000000000001', 'Layout structure defined and design system documented', '#10b981', now() - interval '4 days'),
  ('20000000-0000-0000-0000-000000000001', 'First round of wireframes shared for review', '#1B3FEE', now() - interval '6 days'),
  ('20000000-0000-0000-0000-000000000001', 'Design brief approved by Netflix stakeholders', '#f59f00', now() - interval '10 days'),
  ('20000000-0000-0000-0000-000000000001', 'Development environment set up and team onboarded', '#8b5cf6', now() - interval '14 days');

-- Welcome message
insert into messages (project_id, sender_name, sender_role, content) values
  ('20000000-0000-0000-0000-000000000001', 'Jamaal · Consulaw Tech', 'team',
   'Welcome to Forge! This is your project portal. Feel free to message us anytime with questions or feedback. 👋');
