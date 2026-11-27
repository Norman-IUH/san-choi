import { existsSync } from "node:fs";
import { expect, test } from "vitest";
import { contentSchema, grade, makePlayItems } from "../lib/game";
import { practiceSample } from "../lib/practice-samples";
import { listeningModes, isPhonics, pictureToken, practiceTemplate } from "../lib/games/practice";
import { readingSample, readingSamples } from "../lib/reading-samples";
import type { AudioPracticeMode, ReadingMode } from "../lib/games/practice";
import { builtInMediaUrls } from "../lib/media";
import { vocabularyCatalog } from "../lib/vocabulary-catalog";

test("listening modes use real assets and hide keys and transcripts from students", () => {
  for (const mode of (Object.keys(listeningModes) as AudioPracticeMode[]).filter(mode => !isPhonics(mode))) {
    const item = practiceSample(mode).item;
    const template = practiceTemplate(mode);
    expect(contentSchema(template).safeParse([item]).success, mode).toBe(true);
    const view = makePlayItems(template, [item])[0];
    expect(view).not.toHaveProperty("answers");
    expect(view).not.toHaveProperty("alternatives");
    expect(view.practice?.transcript).toBeUndefined();
    const answer = item.practice?.pictureChoices ? pictureToken(item.options.indexOf(item.answers[0])) : item.answers[0];
    expect(grade(template, [item], [[answer]]).score).toBe(1);
    expect(grade(template, [item], [[]]).score).toBe(0);
    expect(grade(template, [item], [["Wrong"]]).score).toBe(0);
    for (const path of Object.values(builtInMediaUrls([item]))) expect(existsSync("public" + path)).toBe(true);
  }
  const dictation = practiceSample("dictation").item;
  expect(grade("type-answer", [dictation], [["i have  two red cups"]]).score).toBe(1);
  expect(JSON.stringify(makePlayItems("type-answer", [dictation]))).not.toContain(dictation.answers[0]);
  dictation.practice!.stimulus = dictation.alternatives![0];
  expect(contentSchema("type-answer").safeParse([dictation]).success).toBe(false);
});

test("picture responses use neutral tokens and colour needs both the region and colour", () => {
  const picture = practiceSample("listen").item;
  const view = makePlayItems("quiz", [picture])[0];
  expect(view.options).toEqual(expect.arrayContaining(["image-1", "image-2", "image-3"]));
  expect(JSON.stringify(view)).not.toMatch(/apple|ruler|book/);
  expect(grade("quiz", [picture], [["apple"]]).score).toBe(0);
  const colour = practiceSample("colour").item;
  Object.assign(colour.practice!, { regions: [{ x: 25, y: 25, width: 15, height: 15 }, { x: 75, y: 75, width: 15, height: 15 }], correctRegion: 2 });
  expect(contentSchema("quiz").safeParse([colour]).success).toBe(true);
  expect(makePlayItems("quiz", [colour])[0].practice).not.toHaveProperty("correctRegion");
  expect(grade("quiz", [colour], [["blue", "Vùng 1"]]).score).toBe(0);
  expect(grade("quiz", [colour], [["blue", "Vùng 2"]]).score).toBe(1);
  const matching = practiceSample("listen-match").items;
  expect(contentSchema("quiz").safeParse(matching).success).toBe(true);
  expect(grade("quiz", matching, [["kite"], ["apple"]]).score).toBe(2);
});

test("phonics requires a teacher-reviewed clip and the only opt-in transcript is dialogue", () => {
  for (const mode of (Object.keys(listeningModes) as AudioPracticeMode[]).filter(isPhonics)) {
    const item = practiceSample(mode).item;
    expect(contentSchema("quiz").safeParse([item]).success).toBe(false);
    item.media = { audio: "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.wav" };
    item.practice!.reviewedAudio = true;
    expect(contentSchema("quiz").safeParse([item]).success).toBe(true);
  }
  const dialogue = practiceSample("dialogue").item;
  dialogue.practice!.showTranscript = true;
  expect(makePlayItems("quiz", [dialogue])[0].practice?.transcript).toBe(dialogue.practice!.transcript);
});

test("all six Reading modes score from the server source and project one shared stimulus", () => {
  for (const mode of Object.keys(readingSamples) as ReadingMode[]) {
    const { template, items } = readingSample(mode);
    expect(contentSchema(template).safeParse(items).success, mode).toBe(true);
    const projected = makePlayItems(template, items);
    expect(projected.filter(item => item.practice?.stimulus)).toHaveLength(1);
    expect(projected.every(item => !Object.hasOwn(item, "answers") && !Object.hasOwn(item, "explanation"))).toBe(true);
    expect(grade(template, items, items.map(item => item.answers)).score).toBe(items.length);
    expect(grade(template, items, items.map(() => [])).score).toBe(0);
  }
});

test("all catalog pronunciation pointers exist and coverage counts are real", () => {
  expect(vocabularyCatalog.filter(word => word.ipa && word.example)).toHaveLength(36);
  expect(vocabularyCatalog.filter(word => word.uk)).toHaveLength(36);
  expect(vocabularyCatalog.filter(word => word.us)).toHaveLength(36);
  for (const word of vocabularyCatalog) {
    for (const path of [word.uk, word.us]) if (path) expect(existsSync("public" + path), path).toBe(true);
  }
});
