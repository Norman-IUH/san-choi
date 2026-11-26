import { expect, test } from "vitest";
import { demoContent } from "../lib/demo";
import { compatible, contentSchema, grade, makePlayItems, missedReview } from "../lib/game";
import { mathProblem } from "../lib/games/puzzle-templates";

test("diagram and picture questions reject incomplete media and carry no answer field", () => {
  const diagram = demoContent("labelled-diagram");
  expect(contentSchema("labelled-diagram").safeParse([{ ...diagram[0], pin: { x: 101, y: 10 } }]).success).toBe(false);
  expect(contentSchema("image-quiz").safeParse([{ ...demoContent("image-quiz")[0], optionMedia: [] }]).success).toBe(false);
  expect(makePlayItems("labelled-diagram", diagram)[0]).not.toHaveProperty("answers");
  expect(compatible("labelled-diagram", "quiz", diagram)).toBe(false);
});

test("memory and ranking score only the original order and memory projections retain teacher sequence", () => {
  for (const template of ["watch-memorize", "rank-order"] as const) {
    const original = demoContent(template);
    expect(grade(template, original, original.map(i => [...i.answers].reverse())).score).toBe(0);
    const view = makePlayItems(template, original);
    if (template === "watch-memorize") expect(view[0].memory).toEqual(original[0].answers);
    else expect(view[0]).not.toHaveProperty("memory");
  }
});

test("math problems are deterministic, division uses whole numbers, and wrong answers report the expected number", () => {
  const source = demoContent("maths-generator");
  expect(mathProblem(source[1].math!, 1).left % mathProblem(source[1].math!, 1).right).toBe(0);
  const view = makePlayItems("maths-generator", source);
  expect(view[1].equation).not.toHaveProperty("answer");
  const correct = mathProblem(source[1].math!, 1).answer;
  expect(grade("maths-generator", [source[1]], [[correct]], 1).score).toBe(1);
  expect(missedReview(source, [{ answer: [], correct: null }, { answer: ["999"], correct: false }])[0].expected).toEqual([correct]);
  expect(contentSchema("maths-generator").safeParse([{ ...source[1], math: { operation: "divide", min: 0, max: 30 } }]).success).toBe(false);
});
