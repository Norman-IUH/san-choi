import { expect, test } from "vitest";
import { contentSchema, grade, makePlayItems } from "../lib/game";
import { defaultRubric, reviewScores, speakingModes, writingModes, type ProductiveMode } from "../lib/games/productive";
import { productiveSample } from "../lib/productive-samples";

test("all 12 productive modes validate and project prompts without rubric or solutions", () => {
  for (const mode of Object.keys({ ...speakingModes, ...writingModes }) as ProductiveMode[]) {
    const { template, items } = productiveSample(mode);
    expect(contentSchema(template).safeParse(items).success, mode).toBe(true);
    for (const item of makePlayItems(template, items)) {
      expect(item).not.toHaveProperty("answers");
      expect(item.practice?.production).not.toHaveProperty("rubric");
    }
  }
});

test("objective writing accepts declared variants while open writing stays pending", () => {
  const objective = productiveSample("short-answers");
  expect(grade(objective.template, objective.items, [["It is red."]]).score).toBe(1);
  expect(grade(objective.template, objective.items, [["Green"]]).score).toBe(0);
  expect(grade(objective.template, objective.items, [[]]).score).toBe(0);
  const subjective = productiveSample("short-answers", true);
  expect(grade(subjective.template, subjective.items, [["It is red."]])).toEqual({ correct: [null], score: null, total: 0 });
});

test("rubric accepts partial feedback drafts and validates each score before publishing", () => {
  const rubric = defaultRubric("Writing");
  const form = new FormData();
  form.set("criterion-0", "5");
  expect(reviewScores(rubric, form, false)).toBeNull();
  form.set("criterion-0", "3");
  expect(reviewScores(rubric, form, false)).toEqual({ scores: [3, null, null, null, null], total: null, maximum: 20 });
  expect(reviewScores(rubric, form, true)).toBeNull();
  for (let i = 1; i < rubric.length; i++) form.set(`criterion-${i}`, "4");
  expect(reviewScores(rubric, form, true)?.total).toBe(19);
});
