import "server-only";
import { contentSchema, isTemplate } from "./game";
import { sampleStep } from "./lesson-plan-samples";
import type { LessonStep } from "./lesson-plan";
import { check, type database } from "./supabase";

export async function lessonActivity(db: Awaited<ReturnType<typeof database>>, owner: string, step: LessonStep) {
  if (step.kind === "sample") {
    const sample = sampleStep(step.source);
    return sample ? { ...sample, activityId: null, draft: false } : null;
  }
  const { data, error } = await db.from("activities").select("id,title,template,content,draft")
    .eq("id", step.source).eq("owner_id", owner).is("deleted_at", null).maybeSingle();
  check(error, "read_lesson_activity");
  if (!data || !isTemplate(data.template)) return null;
  const items = contentSchema(data.template).safeParse(data.content);
  return { title: data.title, template: data.template, items: items.success ? items.data : [], activityId: data.id, draft: data.draft };
}
