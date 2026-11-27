import { existsSync } from "node:fs";
import { expect, test } from "vitest";
import { contentSchema, grade, makePlayItems } from "../lib/game";
import { practiceSample } from "../lib/practice-samples";
import { isPhonics, practiceModeSchema, practiceTemplate } from "../lib/games/practice";
import { builtInMediaUrls } from "../lib/media";
import { vocabularyCatalog } from "../lib/vocabulary-catalog";

test("listening modes use real assets and hide keys and transcripts from students", () => {
  for (const mode of practiceModeSchema.options.filter(mode => !isPhonics(mode))) {
    const item = practiceSample(mode).item;
    const template = practiceTemplate(mode);
    expect(contentSchema(template).safeParse([item]).success, mode).toBe(true);
    const view = makePlayItems(template, [item])[0];
    expect(view).not.toHaveProperty("answers");
    expect(view).not.toHaveProperty("alternatives");
    expect(view.practice?.transcript).toBeUndefined();
    expect(grade(template, [item], [[item.answers[0]]]).score).toBe(1);
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

test("phonics requires a teacher-reviewed clip and the only opt-in transcript is dialogue", () => {
  for (const mode of practiceModeSchema.options.filter(isPhonics)) {
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

test("all catalog pronunciation pointers exist and coverage counts are real", () => {
  expect(vocabularyCatalog.filter(word => word.ipa && word.example)).toHaveLength(36);
  expect(vocabularyCatalog.filter(word => word.uk)).toHaveLength(36);
  expect(vocabularyCatalog.filter(word => word.us)).toHaveLength(36);
  for (const word of vocabularyCatalog) {
    for (const path of [word.uk, word.us]) if (path) expect(existsSync("public" + path), path).toBe(true);
  }
});
