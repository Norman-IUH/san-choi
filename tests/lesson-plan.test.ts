import { expect, test } from "vitest";
import { contentSchema } from "../lib/game";
import { emptyPlan, lessonPlanSchema } from "../lib/lesson-plan";
import { samplePlan, samplePlans } from "../lib/lesson-plan-samples";

test("eight original plans each link five valid activities and five bank entries", () => {
  expect(Object.keys(samplePlans)).toHaveLength(8);
  for (const key of Object.keys(samplePlans)) {
    const plan = samplePlan(key)!;
    expect(plan.lesson.entry_keys).toHaveLength(5);
    expect(plan.activities).toHaveLength(5);
    for (const activity of plan.activities) expect(contentSchema(activity.template).safeParse(activity.items).success, activity.title).toBe(true);
    if (key.endsWith("-skills")) {
      expect(plan.activities[2].items[0].english?.skill).toBe("Speaking");
      expect(plan.activities[4].items[0].english?.skill).toBe("Writing");
    }
  }
});

test("plans accept empty drafts and enforce classroom minutes and unique step IDs", () => {
  expect(lessonPlanSchema.safeParse(emptyPlan).success).toBe(true);
  expect(lessonPlanSchema.safeParse({ ...emptyPlan, draft: false }).success).toBe(false);
  const step = { id: "11111111-1111-4111-8111-111111111111", kind: "sample", source: "classroom/0", phase: "practice", minutes: 20 };
  expect(lessonPlanSchema.safeParse({ ...emptyPlan, steps: [step] }).success).toBe(true);
  expect(lessonPlanSchema.safeParse({ ...emptyPlan, steps: [step, step] }).success).toBe(false);
  expect(lessonPlanSchema.safeParse({ ...emptyPlan, steps: [{ ...step, minutes: 40 }] }).success).toBe(false);
  expect(lessonPlanSchema.safeParse({ ...emptyPlan, steps: [{ ...step, minutes: 40, phase: "homework" }] }).success).toBe(true);
});
