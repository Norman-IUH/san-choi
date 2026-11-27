"use server";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { insertAssignment } from "@/lib/assignment-server";
import { account, check } from "@/lib/supabase";
import { lessonDetailsSchema, lessonPlanSchema } from "@/lib/lesson-plan";
import { samplePlan, sampleStep } from "@/lib/lesson-plan-samples";
import { lessonActivity } from "@/lib/lesson-plan-server";
import { lessonSchema } from "@/lib/vocabulary-bank";
import { contentSchema } from "@/lib/game";

const uuid = z.uuid();

export async function savePlan(id: string | null, initialSample: string | null, _previous: string, form: FormData) {
  const { db, user } = await account(true);
  if (id !== null && !uuid.safeParse(id).success) notFound();
  const details = lessonDetailsSchema.safeParse(Object.fromEntries(form));
  const raw = form.get("steps");
  if (!details.success || typeof raw !== "string" || raw.length > 14000) return "Kiểm tra tên, cấp độ, chủ đề và unit.";
  let steps: unknown;
  try { steps = JSON.parse(raw); } catch { return "Danh sách hoạt động không hợp lệ."; }
  const plan = lessonPlanSchema.safeParse({ version: 1, draft: form.get("status") !== "ready", minutes: Number(form.get("minutes")),
    objectives: form.get("objectives"), notes: form.get("notes"), homework: form.get("homework"), steps });
  if (!plan.success) return plan.error.issues[0].code === "custom" ? plan.error.issues[0].message : "Kiểm tra thời lượng và nội dung của giáo án.";
  if (plan.data.steps.some(step => step.kind === "sample" && !sampleStep(step.source))) return "Có hoạt động mẫu không khả dụng.";
  const ids = [...new Set(plan.data.steps.flatMap(step => step.kind === "activity" ? [step.source] : []))];
  if (ids.length) {
    const { data, error } = await db.from("activities").select("id").eq("owner_id", user.id).is("deleted_at", null).in("id", ids);
    check(error, "check_plan_activities");
    if (data?.length !== ids.length) return "Có hoạt động không còn trong thư viện. Hãy bỏ mục đó rồi lưu lại.";
  }
  const row = { ...details.data, plan: plan.data };
  const operation = id ? db.from("vocabulary_lessons").update(row).eq("id", id).eq("owner_id", user.id) :
    db.from("vocabulary_lessons").insert({ ...row, difficulty: "gentle", entry_keys: initialSample ? samplePlan(initialSample)?.lesson.entry_keys ?? [] : [] });
  const { data, error } = await operation.select("id").maybeSingle();
  if (error?.code === "23503") return "Có hoạt động không còn trong thư viện. Hãy kiểm tra lại các mục đã chọn.";
  check(error, "save_lesson_plan");
  if (!data) notFound();
  redirect(`/library/${data.id}?saved=plan`);
}

export async function duplicatePlan(id: string) {
  const { db, user } = await account(true);
  if (!uuid.safeParse(id).success) notFound();
  const source = await db.from("vocabulary_lessons").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle();
  check(source.error, "read_lesson_to_duplicate");
  if (!source.data) notFound();
  const lesson = lessonSchema.parse(source.data);
  const plan = lessonPlanSchema.parse(source.data.plan);
  const activityIds = plan.steps.flatMap(step => step.kind === "activity" ? [step.source] : []);
  const existing = activityIds.length ? await db.from("activities").select("id").eq("owner_id", user.id).is("deleted_at", null).in("id", activityIds) : null;
  check(existing?.error ?? null, "find_duplicated_plan_activities");
  const available = new Set(existing?.data?.map(row => row.id));
  const result = await db.from("vocabulary_lessons").insert({ ...lesson, title: lesson.title.slice(0, 90) + " (bản sao)",
    plan: { ...plan, draft: true, steps: plan.steps.filter(step => step.kind === "sample" || available.has(step.source)) },
  }).select("id").single();
  check(result.error, "duplicate_lesson_plan");
  redirect(`/library/${result.data!.id}?saved=plan`);
}

export async function assignLessonStep(id: string, stepId: string, form: FormData) {
  const { db, user } = await account(true);
  if (!uuid.safeParse(id).success || !uuid.safeParse(stepId).success) notFound();
  const { data, error } = await db.from("vocabulary_lessons").select("plan").eq("id", id).eq("owner_id", user.id).maybeSingle();
  check(error, "load_assignment_lesson");
  const plan = lessonPlanSchema.safeParse(data?.plan);
  const step = plan.success && plan.data.steps.find(row => row.id === stepId);
  if (!step) notFound();
  const activity = await lessonActivity(db, user.id, step);
  if (!activity || activity.draft || !contentSchema(activity.template).safeParse(activity.items).success) notFound();
  const assignment = await insertAssignment({ owner_id: user.id, activity_id: activity.activityId,
    title: activity.title, template: activity.template, content: activity.items, lesson_id: id, lesson_step: stepId }, form);
  if (!assignment) redirect(`/library/${id}?step=${stepId}&problem=deadline`);
  redirect(`/assignments/${assignment}`);
}
