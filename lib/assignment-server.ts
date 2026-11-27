import "server-only";
import { check, privilegedDatabase } from "./supabase";
import type { Item, Template } from "./game";
import { assessmentSchema, isSpeaking } from "./games/productive";
import { z } from "zod";

export async function insertAssignment(source: { owner_id: string; activity_id: string | null; title: string; template: Template; content: Item[];
  lesson_id?: string; lesson_step?: string; level?: string }, form: FormData) {
  const deadline = form.get("deadline");
  const due = typeof deadline === "string" && deadline ? Date.parse(deadline + ":00+07:00") : null;
  if (due !== null && (!Number.isFinite(due) || due <= Date.now())) return null;
  const { level, ...fields } = source;
  const first = fields.content[0];
  const rubric = first?.practice?.production?.rubric;
  const assessment = rubric && assessmentSchema.parse({ version: 1, skill: isSpeaking(first!.practice!.mode) || first?.practice?.starters?.paper === "speaking" ? "Speaking" : "Writing",
    level: level ?? first?.english?.level ?? "", rubric });
  const db = privilegedDatabase();
  const snapshot = {
    ...fields, ...(assessment && { assessment }), deadline: due === null ? null : new Date(due).toISOString(),
    require_name: form.has("require_name"), show_score: form.has("show_score"), show_review: form.has("show_review"),
  };
  const classroom = form.get("classroom");
  if (classroom) {
    const id = z.uuid().safeParse(classroom);
    const cap = z.coerce.number().int().min(1).max(20).safeParse(form.get("attempt_cap"));
    const selected = z.array(z.uuid()).max(1000).safeParse([...new Set(form.getAll("recipient"))]);
    const specific = form.get("audience") === "selected";
    if (!id.success || !cap.success || !selected.success || (specific && !selected.data.length)) return "classroom" as const;
    const { data, error } = await db.rpc("assign_classroom", { p_owner: source.owner_id, p_class: id.data,
      p_students: specific ? selected.data : null, p_cap: cap.data, p_snapshot: snapshot });
    if (error?.code === "23514" && error.message.includes("lesson draft")) return "draft" as const;
    check(error, "create_classroom_assignment");
    return typeof data === "string" ? data : "classroom" as const;
  }
  const { data, error } = await db.from("assignments").insert(snapshot).select("id").single();
  if (error?.code === "23514" && error.message.includes("lesson draft")) return "draft" as const;
  check(error, "create_assignment");
  return data!.id as string;
}
