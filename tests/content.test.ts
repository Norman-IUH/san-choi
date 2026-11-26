import { expect, test } from "vitest";
import { deckIds, englishDeckContent } from "../lib/english-samples";
import { compatible, contentSchema, grade, makePlayItems, missedReview } from "../lib/game";
import { itemMediaPaths } from "../lib/media";
import { vocabularyItems } from "../lib/vocabulary-import";

test.each(deckIds)("%s sample preserves vocabulary across pair templates", id => {
  const items = englishDeckContent(id);
  expect(compatible("flash-cards", "match-up", items)).toBe(true);
  expect(contentSchema("match-up").parse(items)).toEqual(items);
  expect(grade("match-up", items, items.map(item => item.answers)).score).toBe(items.length);
});

test("vocabulary import validates grade and required cells", () => {
  const header = ["word", "meaning", "level", "ipa"];
  expect(vocabularyItems([header, ["bridge", "cây cầu", "A1 Movers", "/brɪdʒ/"]])[0]).toMatchObject({
    version: 2, prompt: "bridge", answers: ["cây cầu"], english: { level: "A1 Movers", ipa: "/brɪdʒ/" },
  });
  expect(() => vocabularyItems([header, ["bridge", "", "B2"]])).toThrow("Dòng dữ liệu 1");
  expect(() => vocabularyItems([["word"], ["bridge"]])).toThrow("hai cột");
});

test("alternatives grade fill-in answers without leaking the answer or explanation in the player payload", () => {
  const items = contentSchema("sentence").parse([{ version: 2, prompt: "A ___ is in the lake.",
    answers: ["duck"], alternatives: ["bird"], explanation: "Both words fit." }]);
  expect(grade("sentence", items, [[" BIRD "]]).score).toBe(1);
  expect(makePlayItems("sentence", items)[0]).not.toHaveProperty("explanation");
  expect(makePlayItems("sentence", items)[0]).not.toHaveProperty("alternatives");
  expect(missedReview(items, [{ answer: ["fish"], correct: false }])).toEqual([{
    prompt: "A ___ is in the lake.", selected: ["fish"], expected: ["duck", "bird"], explanation: "Both words fit.",
  }]);
});

test("media paths are relative, typed and collected without duplicates", () => {
  const path = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.png";
  const item = { version: 2, prompt: "Choose", answers: ["one"], options: ["one", "two"],
    media: { image: path }, optionMedia: [{ option: "two", image: path }] };
  expect(itemMediaPaths(contentSchema("quiz").parse([item]))).toEqual([path]);
  expect(contentSchema("quiz").safeParse([{ ...item, media: { image: "https://example.com/picture.png" } }]).success).toBe(false);
  expect(contentSchema("quiz").safeParse([{ ...item, optionMedia: [{ option: "missing", image: path }] }]).success).toBe(false);
});
