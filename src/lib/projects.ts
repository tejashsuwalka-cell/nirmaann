import { supabase } from "@/integrations/supabase/client";
import type { Layout } from "./layout-types";

export interface Project extends Layout { id: string; name: string; type: string; owner_id: string; created_at: string; updated_at: string }

// jsonb columns come back as Json; the app owns their shape.
export const toProject = (row: Record<string, unknown>) => row as unknown as Project;

export async function listProjects() {
  const { data, error } = await supabase.from("projects").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toProject);
}
export async function getProject(id: string) {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toProject(data) : null;
}
export async function saveProject(id: string, name: string, l: Layout) {
  const { error } = await supabase.from("projects").update({
    name, walls: l.walls as never, doors: l.doors as never, windows: l.windows as never, furniture: l.furniture as never,
  }).eq("id", id);
  if (error) throw error;
}
