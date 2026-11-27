import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { contentSchema, grade, makePlayItems } from "../lib/game";
import { cambridgeCounts, type StarterPaper } from "../lib/games/starters";
import { builtInMediaUrls, itemMediaPaths } from "../lib/media";
import { flyerPaper } from "../lib/flyers-paper";
import { localPlay } from "../lib/local-play";

function verifyPaper(paper: StarterPaper) {
  const mock = flyerPaper(paper)!;
  const counts = cambridgeCounts({ level: "flyers", paper });
  const parts = counts.map((_, i) => flyerPaper(paper, i + 1)!);
  expect(parts.map(part => part.items.length)).toEqual(counts);
  expect(mock.items.map(item => item.prompt)).toEqual(parts.flatMap(part => part.items.map(item => item.prompt)));
  expect(flyerPaper(paper, counts.length + 1)).toBeNull();
  for (const { template, items } of [...parts, mock]) {
    expect(contentSchema(template).safeParse(items).success).toBe(true);
    expect(itemMediaPaths(items)).toEqual([]);
    for (const path of Object.keys(builtInMediaUrls(items))) {
      const media = readFileSync("public" + path);
      expect(media.toString("ascii", 0, 4)).toBe("RIFF");
      expect(media.readUInt32LE(4)).toBe(media.length - 8);
      if (path.endsWith(".webp")) expect(media.toString("ascii", 8, 12)).toBe("WEBP");
    }
    expect(JSON.stringify(makePlayItems(template, items))).not.toMatch(/"answers"|"teacher"|"rubric"/);
    expect(JSON.stringify(localPlay(template, items))).not.toMatch(/"teacher"|"rubric"/);
    const responses = items.map(item => item.answers);
    const total = items.filter(item => item.answers.length).length;
    expect(grade(template, items, responses)).toMatchObject({ score: total || null, total });
    if (total > 0) expect(grade(template, items, [[], ["x"], ...responses.slice(2)]).score).toBe(total - 2);
  }
  return mock;
}

test("Flyers Listening has 25 scored questions, including three colour regions and two labelled writing spaces", () => {
  verifyPaper("listening");
  const forms = flyerPaper("listening", 2)!;
  expect(grade(forms.template, forms.items, [["harbour"], ["Reed"], ["quarter past ten"], ["three"], ["raincoat"]]).score).toBe(5);
  const colour = flyerPaper("listening", 5)!.items;
  expect(colour.filter(item => item.practice?.starters?.sign).map(item => item.practice?.starters?.signPosition)).toEqual(["left", "right"]);
  expect(colour[0].practice?.starters?.targets?.every(target => target.mask)).toBe(true);
});

test("Flyers Reading & Writing holds 43 automatic answers and one rubric-scored three-picture story", () => {
  const mock = verifyPaper("reading");
  expect(mock.items).toHaveLength(44);
  expect(mock.items[43].practice?.starters?.visuals).toHaveLength(3);
  expect(mock.items[0].practice?.production?.rubric?.map(row => row.max)).toEqual([2, 2, 1]);
  const free = flyerPaper("reading", 6)!;
  expect(free.items.every(item => !item.practice?.starters?.wordBank && !item.practice?.starters?.choices)).toBe(true);
  const withStoryResponse = mock.items.map(item => item.answers);
  withStoryResponse[43] = ["This is a response that a teacher should mark, even though it has no exact match."];
  expect(grade(mock.template, mock.items, withStoryResponse)).toMatchObject({ score: 43, total: 43 });
  expect(grade(mock.template, mock.items, withStoryResponse).correct.at(-1)).toBeNull();
});
