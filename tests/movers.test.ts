import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { contentSchema, grade, makePlayItems } from "../lib/game";
import { cambridgeCounts, moverPartNames, type StarterPaper } from "../lib/games/starters";
import { builtInMediaUrls, itemMediaPaths } from "../lib/media";
import { moverPaper } from "../lib/movers-paper";
import { localPlay } from "../lib/local-play";

function checkPaper(paper: StarterPaper) {
  const mock = moverPaper(paper)!;
  const sections = moverPartNames[paper].map((_, i) => moverPaper(paper, i + 1)!);
  expect(sections.map(section => section.items.length)).toEqual(cambridgeCounts({ level: "movers", paper }));
  expect(sections.flatMap(section => section.items.map(item => item.prompt))).toEqual(mock.items.map(item => item.prompt));
  for (const { template, items } of [...sections, mock]) {
    expect(contentSchema(template).safeParse(items).success).toBe(true);
    expect(itemMediaPaths(items)).toEqual([]);
    for (const path of Object.keys(builtInMediaUrls(items))) {
      const media = readFileSync("public" + path);
      if (path.endsWith(".wav")) {
        expect(media.toString("ascii", 0, 4)).toBe("RIFF");
        expect(media.readUInt32LE(4)).toBe(media.length - 8);
      } else expect(media.toString("ascii", 8, 12)).toBe("WEBP");
    }
    const projected = JSON.stringify(makePlayItems(template, items));
    expect(projected).not.toMatch(/"answers"|"teacher"|"rubric"/);
    if (items[0].practice?.starters?.mock) expect(projected).not.toContain('"guide"');
    const responses = items.map(item => item.answers);
    const count = items.filter(item => item.answers.length).length;
    expect(grade(template, items, responses)).toMatchObject({ score: count || null, total: count });
    if (count > 0) expect(grade(template, items, [[], ["x"], ...responses.slice(2)]).score).toBe(count - 2);
  }
  expect(moverPaper(paper, sections.length + 1)).toBeNull();
}

test("Movers Listening has 25 scored questions with local pictures and original audio", () => {
  checkPaper("listening");
  const book = moverPaper("listening", 2)!;
  expect(grade(book.template, book.items, [["saturday"], ["Hall"], ["sixteen"], ["nine"], ["bottle"]]).score).toBe(5);
});

test("Movers Reading & Writing holds 33 automatic marks and two open questions for manual review", () => {
  checkPaper("reading");
  const paper = moverPaper("reading")!;
  const responses = paper.items.map(item => item.answers);
  responses[33] = ["A person is standing next to the table."];
  expect(grade(paper.template, paper.items, responses).correct.slice(-2)).toEqual([null, null]);
  expect(paper.items[0].practice?.production?.rubric?.map(row => row.max)).toEqual([1, 1]);
  const snapshot = structuredClone(paper.items);
  snapshot[33].answers = ["Any sentence"];
  expect(contentSchema(paper.template).safeParse(snapshot).success).toBe(false);
});

test("Movers Speaking uses two comparison pictures, four story scenes and four sets of four images", () => {
  checkPaper("speaking");
  const { items, template } = moverPaper("speaking")!;
  expect(items[0].practice?.starters?.visuals).toHaveLength(2);
  expect(items[1].practice?.starters?.visuals).toHaveLength(4);
  expect(items[2].practice?.starters?.groups?.map(group => group.length)).toEqual([4, 4, 4, 4]);
  expect(items[0].practice?.production?.rubric).toHaveLength(5);
  expect(items.every(item => item.practice?.starters?.teacher)).toBe(true);
  expect(JSON.stringify(localPlay(template, items))).not.toMatch(/"teacher"|"rubric"|Contrast the roof colour/);
});
