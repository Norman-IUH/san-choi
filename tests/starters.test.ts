import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contentSchema, grade, makePlayItems } from "../lib/game";
import { starterPartNames, starterPaperSchema } from "../lib/games/starters";
import { builtInMediaUrls, itemMediaPaths } from "../lib/media";
import { starterPaper } from "../lib/starters-paper";

describe("original Starters papers", () => {
  for (const paper of starterPaperSchema.options) {
    it(paper + " preserves the structure, scoring, and media of all parts", () => {
      const mock = starterPaper(paper)!;
      const sections = starterPartNames[paper].map((_, index) => starterPaper(paper, index + 1)!);
      expect(sections.flatMap(section => section.items.map(item => item.prompt))).toEqual(mock.items.map(item => item.prompt));
      for (const { template, items } of [...sections, mock]) {
        expect(contentSchema(template).safeParse(items).success).toBe(true);
        expect(itemMediaPaths(items)).toEqual([]);
        for (const path of Object.keys(builtInMediaUrls(items))) {
          expect(existsSync("public" + path), path).toBe(true);
          if (path.endsWith(".wav")) {
            const wav = readFileSync("public" + path);
            expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
            expect(wav.readUInt32LE(40)).toBe(wav.length - 44);
          }
        }
        const learner = JSON.stringify(makePlayItems(template, items));
        expect(learner).not.toMatch(/"answers"|"teacher"|"rubric"/);
        if (items[0].practice?.starters?.mock) expect(learner).not.toContain('"guide"');
        else expect(learner).toContain(paper === "speaking" ? '"guide"' : '"example"');
        const responses = items.map(item => item.answers);
        const expected = paper === "speaking" ? null : items.length;
        expect(grade(template, items, responses).score).toBe(expected);
        expect(grade(template, items, [[], ["wrong"], ...responses.slice(2)]).score).toBe(expected === null ? null : expected - 2);
      }
      expect(starterPaper(paper, 0)).toBeNull();
      expect(starterPaper(paper, sections.length + 1)).toBeNull();
      expect(contentSchema(mock.template).safeParse(mock.items.slice(1)).success).toBe(false);
    });
  }

  it("keeps only Speaking subject to a rubric", () => {
    expect(starterPaper("speaking")!.items[0].practice?.production?.rubric).toHaveLength(5);
    expect(starterPaper("reading")!.items[0].practice?.production).toBeUndefined();
  });
});
