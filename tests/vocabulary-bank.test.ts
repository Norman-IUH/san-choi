import { expect, test } from "vitest";
import { csv } from "../lib/csv";
import { importBankRows, lessonSchema, vocabularyGame } from "../lib/vocabulary-bank";
import { starterLessons, vocabularyCatalog } from "../lib/vocabulary-catalog";
import { grade, levels } from "../lib/game";
import { readVocabularyRows } from "../lib/vocabulary-import";

test("catalog has 110 original entries at each internal level with unique stable IDs", () => {
  expect(new Set(vocabularyCatalog.map(word => word.id)).size).toBe(440);
  for (const level of levels) {
    const words = vocabularyCatalog.filter(word => word.level === level);
    expect(words).toHaveLength(110);
    expect(words.every(word => word.word && word.meaning && word.part && word.topic)).toBe(true);
  }
  expect(vocabularyCatalog.filter(word => word.ipa && word.example && word.uk && word.us)).toHaveLength(36);
});

test("four starter lessons reuse the same words for flashcards, word exercises and graded answers", () => {
  for (const starter of starterLessons) {
    const words = starter.keys.map(key => vocabularyCatalog.find(word => word.id === key)!);
    expect(lessonSchema.safeParse({ ...starter, entry_keys: starter.keys, skill: "Vocabulary", difficulty: "gentle" }).success).toBe(true);
    expect(vocabularyGame("flash-cards", words, "Vocabulary", "gentle")?.[0].english?.uk).toContain("-uk.wav");
    const quiz = vocabularyGame("quiz", words, "Vocabulary", "gentle")!;
    expect(quiz).toHaveLength(5);
    expect(grade("quiz", quiz, [quiz[0].answers, [quiz[1].options[1]], [], [], []])).toMatchObject({ score: 1, total: 5 });
    expect(vocabularyGame("maze-chase", words, "Vocabulary", "gentle")?.[0].arcade?.timed).toBe(false);
    expect(vocabularyGame("labelled-diagram", words, "Vocabulary", "gentle")).toBeNull();
  }
});

test("CSV exports keep Vietnamese text and bank imports catch duplicate rows", async () => {
  const file = new File([csv([["word", "meaning", "part", "ipa"], ["tree", "cây", "noun", "/triː/"]])], "vocabulary.csv");
  const defaults = { level: levels[0], topic: "Nature" };
  const rows = await readVocabularyRows(file);
  expect(importBankRows(rows, defaults)).toMatchObject([{ word: "tree", meaning: "cây", part: "noun", ipa: "/triː/", ...defaults }]);
  expect(() => importBankRows([rows[0], rows[1], [" TREE ", "cây", "", ""]], defaults)).toThrow(/Dòng 3 trùng/);
});
