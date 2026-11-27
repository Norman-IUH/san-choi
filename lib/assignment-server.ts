import "server-only";
import { check, privilegedDatabase } from "./supabase";
import type { Item, Template } from "./game";

export async function insertAssignment(source: { owner_id: string; activity_id: string | null; title: string; template: Template; content: Item[];
  lesson_id?: string; lesson_step?: string }, form: FormData) {
  const deadline = form.get("deadline");
  const due = typeof deadline === "string" && deadline ? Date.parse(deadline + ":00+07:00") : null;
  if (due !== null && (!Number.isFinite(due) || due <= Date.now())) return null;
  const { data, error } = await privilegedDatabase().from("assignments").insert({
    ...source, deadline: due === null ? null : new Date(due).toISOString(),
    require_name: form.has("require_name"), show_score: form.has("show_score"), show_review: form.has("show_review"),
  }).select("id").single();
  check(error, "create_assignment");
  return data!.id as string;
}
