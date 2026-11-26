import { expect, test } from "vitest";
import { compatible, contentSchema, grade, makePlayItems } from "../lib/game";
import { demoContent } from "../lib/demo";
import { buildCrossword, hangmanPattern, lineBetween, makeWordsearch } from "../lib/games/word-puzzles";

test("wordsearch draws selectable paths in either direction and scores against the stored word", () => {
  const items = demoContent("wordsearch");
  for (const [index, item] of items.entries()) {
    const { grid, size, positions } = makeWordsearch(item.answers[0], index);
    expect(lineBetween(positions[0], positions.at(-1)!, size)).toEqual(positions);
    const reversed = lineBetween(positions.at(-1)!, positions[0], size).map(position => grid[position]).join("");
    expect(grade("wordsearch", [item], [[reversed]]).score).toBe(1);
  }
  expect(lineBetween(0, 8, 6)).toEqual([]);
});

test("crossword exposes crossing coordinates without returning answers and rejects disconnected puzzles", () => {
  const original = demoContent("crossword");
  const items = makePlayItems("crossword", original);
  expect(items[0].slot?.cells[1]).toEqual(items[1].slot?.cells[1]);
  expect(JSON.stringify(items)).not.toContain('"answers"');
  expect(contentSchema("crossword").safeParse([{ ...original[0], answers: ["xyz"] }, original[1]]).success).toBe(false);
  expect(grade("crossword", original, [["CAT"], ["BAT"]]).score).toBe(1);
  expect(buildCrossword(["CAT", "DOG", "TOAD"])?.slots.map(slot => slot.cells.length)).toEqual([3, 3, 4]);
});

test("hangman hides unguessed letters and counts only misses", () => {
  expect(hangmanPattern("duck", ["D", "Z", "C"])).toEqual({ pattern: ["D", "", "C", ""], misses: 1 });
  expect(makePlayItems("hangman", demoContent("hangman"))[0]).toMatchObject({ letters: 4, options: [] });
});

test("new templates accept compatible prior content and reject lossy switches", () => {
  expect(compatible("unjumble", "word-magnets", demoContent("unjumble"))).toBe(true);
  expect(compatible("true-false", "quiz", demoContent("true-false"))).toBe(true);
  expect(compatible("quiz", "true-false", demoContent("quiz"))).toBe(false);
  expect(compatible("group-sort", "matching-pairs", demoContent("group-sort"))).toBe(false);
  expect(grade("type-answer", demoContent("type-answer").slice(0, 1), [[" A  PENCIL "]]).score).toBe(1);
});
