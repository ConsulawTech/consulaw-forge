-- Atomic view counter: increments view_count and updates viewed_at in a single
-- statement so concurrent requests can't race and reset the count.
CREATE OR REPLACE FUNCTION increment_proposal_view(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE proposals
  SET
    view_count = view_count + 1,
    viewed_at  = now(),
    status     = CASE WHEN status <> 'draft' THEN 'viewed' ELSE status END
  WHERE id = p_id;
$$;
