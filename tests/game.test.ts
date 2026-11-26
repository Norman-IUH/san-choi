import { describe, expect, test } from "vitest";
import { compatible, contentSchema, doubleMarker, grade, makePlayItems, templateIds, templates } from "../lib/game";
import { demoContent } from "../lib/demo";
import { csv } from "../lib/csv";
import { mathProblem } from "../lib/games/puzzle-templates";

describe("demo laws", () => {
  test.each(templateIds)("%s validates and grades its main interaction", id => {
    const sample = demoContent(id);
    expect(contentSchema(id).safeParse(sample).success).toBe(true);
    expect(makePlayItems(id, sample)).toHaveLength(sample.length);
    const correct = sample.map((item, index) => item.math ? [mathProblem(item.math, index).answer] :
      templates[id].kind === "word" ? Array.from(item.answers[0]) : [...item.answers]);
    const result = grade(id, sample, correct);
    const exploration = templates[id].kind === "prompt" || id === "flash-cards" || id === "flip-tiles";
    expect(result.score).toBe(exploration ? null : sample.length);
    expect(grade(id, sample, sample.map(() => ["sai"])).score).toBe(exploration ? null : 0);
  });
  test("pairs are copied losslessly and incompatible schemas are rejected", () => {
    const source = demoContent("match-up");
    const snapshot = structuredClone(source);
    expect(compatible("match-up", "flash-cards", source)).toBe(true);
    expect(contentSchema("flash-cards").parse(source)).toEqual(snapshot);
    expect(compatible("match-up", "quiz", source)).toBe(false);
    expect(source).toEqual(snapshot);
  });
  test("choice checks all selected values and supports arbitrary answer order", () => {
    const item = demoContent("quiz")[1];
    expect(grade("quiz", [item], [["Đèn đang sáng", "Mặt Trời"]]).score).toBe(1);
    expect(grade("quiz", [item], [["Mặt Trời"]]).score).toBe(0);
    expect(makePlayItems("quiz", [item])[0]).not.toHaveProperty("answers");
  });
  test("sequence uses order and text matching preserves Vietnamese accents", () => {
    expect(grade("unjumble", demoContent("unjumble").slice(0, 1), [["đi", "Em", "học", "vào", "buổi sáng"]]).score).toBe(0);
    expect(grade("sentence", demoContent("sentence").slice(0, 1), [[" ĐÔNG "]]).score).toBe(1);
    expect(grade("sentence", demoContent("sentence").slice(0, 1), [["dong"]]).score).toBe(0);
    expect(grade("anagram", [{ prompt: "test", answers: ["nắng"], options: [] }], [["n", "ắ", "n", "g"]]).score).toBe(1);
  });
  test("Gameshow awards the bonus to one question per play", () => {
    const items = demoContent("gameshow");
    const first = [...items[0].answers, doubleMarker];
    expect(grade("gameshow", items, [first, items[1].answers, items[2].answers])).toMatchObject({ score: 4, total: 4 });
    expect(grade("gameshow", items, [first, [...items[1].answers, doubleMarker], items[2].answers])).toMatchObject({ score: 3, total: 4 });
  });
  test("CSV quotes nicknames and neutralizes spreadsheet formulas", () => {
    expect(csv([["Tên", "=1+1", 'a"b', -1]])).toBe('\uFEFF"Tên","\'=1+1","a""b","-1"');
  });
});
