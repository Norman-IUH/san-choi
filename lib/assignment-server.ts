import "server-only";
import { check, privilegedDatabase } from "./supabase";
import type { Item, Template } from "./game";
import { assessmentSchema, isSpeaking } from "./games/productive";

export async function insertAssignment(source: { owner_id: string; activity_id: string | null; title: string; template: Template; content: Item[];
  lesson_id?: string; lesson_step?: string; level?: string }, form: FormData) {
  const deadline = form.get("deadline");
  const due = typeof deadline === "string" && deadline ? Date.parse(deadline + ":00+07:00") : null;
  if (due !== null && (!Number.isFinite(due) || due <= Date.now())) return null;
  const { level, ...fields } = source;
  const first = fields.content[0];
  const rubric = first?.practice?.production?.rubric;
  const assessment = rubric && assessmentSchema.parse({ version: 1, skill: isSpeaking(first!.practice!.mode) ? "Speaking" : "Writing",
    level: level ?? first?.english?.level ?? "", rubric });
  const { data, error } = await privilegedDatabase().from("assignments").insert({
    ...fields, ...(assessment && { assessment }), deadline: due === null ? null : new Date(due).toISOString(),
    require_name: form.has("require_name"), show_score: form.has("show_score"), show_review: form.has("show_review"),
  }).select("id").single();
  if (error?.code === "23514" && error.message.includes("lesson draft")) return "draft" as const;
  check(error, "create_assignment");
  return data!.id as string;
}
