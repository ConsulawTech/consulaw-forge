ALTER TABLE proposals ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS proposals_project_id_idx ON proposals (project_id);
