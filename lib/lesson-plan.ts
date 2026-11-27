import { z } from "zod";
import { levels, skills } from "./game";

export const lessonPhases = {
  warmup: "Khởi động", presentation: "Giới thiệu", practice: "Luyện tập", game: "Trò chơi", review: "Ôn tập", homework: "Bài về nhà",
} as const;
const phaseSchema = z.enum(Object.keys(lessonPhases) as (keyof typeof lessonPhases)[]);
const stepBase = z.object({ id: z.uuid(), phase: phaseSchema, minutes: z.number().int().min(1).max(120) });
export const lessonPlanSchema = z.object({
  version: z.literal(1), draft: z.boolean(), objectives: z.string().trim().max(1200), minutes: z.number().int().min(1).max(240),
  notes: z.string().trim().max(2400), homework: z.string().trim().max(1200),
  steps: z.array(z.discriminatedUnion("kind", [
    stepBase.extend({ kind: z.literal("activity"), source: z.uuid() }),
    stepBase.extend({ kind: z.literal("sample"), source: z.string().regex(/^[a-z-]{1,40}\/[0-4]$/) }),
  ])).max(30).refine(steps => new Set(steps.map(step => step.id)).size === steps.length),
}).refine(plan => (plan.draft || plan.steps.length > 0) &&
  plan.steps.reduce((sum, step) => sum + (step.phase === "homework" ? 0 : step.minutes), 0) <= plan.minutes,
  "Thời lượng hoạt động trên lớp phải nằm trong thời lượng giáo án. Giáo án sẵn sàng cần ít nhất một hoạt động.");
export type LessonPlan = z.infer<typeof lessonPlanSchema>;
export type LessonStep = LessonPlan["steps"][number];
export const emptyPlan: LessonPlan = { version: 1, draft: true, objectives: "", minutes: 35, notes: "", homework: "", steps: [] };

export const lessonDetailsSchema = z.object({
  title: z.string().trim().min(1).max(100), level: z.enum(levels), skill: z.enum(skills),
  topic: z.string().trim().min(1).max(80), unit: z.string().trim().min(1).max(80),
});
export type LessonDetails = z.infer<typeof lessonDetailsSchema>;
