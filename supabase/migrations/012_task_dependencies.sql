CREATE TABLE IF NOT EXISTS task_dependencies (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id              uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id   uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at           timestamptz DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team: full access to task_dependencies" ON task_dependencies
  FOR ALL USING (current_role_is('team'));
