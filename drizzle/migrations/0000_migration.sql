CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL DEFAULT 'Untitled Project',
  type text NOT NULL DEFAULT 'Residential Design',
  walls jsonb NOT NULL DEFAULT '[]'::jsonb,
  doors jsonb NOT NULL DEFAULT '[]'::jsonb,
  windows jsonb NOT NULL DEFAULT '[]'::jsonb,
  furniture jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.projects FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "own insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "own update" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "own delete" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER projects_touch BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();