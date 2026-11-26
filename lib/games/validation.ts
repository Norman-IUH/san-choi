import { z } from "zod";
import { templates, type Template } from "./registry";
import { itemSchema, normalize, type Item } from "./model";
import { englishPuzzleWord, truthOptions } from "./word-templates";
import { buildCrossword } from "./word-puzzles";
import { doubleMarker } from "./scoring";

export function contentSchema(template: Template, draft = false) {
  return z.array(itemSchema).min(draft ? 0 : 1).max(60).superRefine((items, context) => {
    if (draft) return;
    const kind = templates[template].kind;
    const englishPuzzle = template === "wordsearch" || template === "spell-word" || template === "hangman" || template === "crossword";
    if (template === "crossword" && (items.length > 10 || !buildCrossword(items.map(item => item.answers[0] ?? "")))) {
      context.addIssue({ code: "custom", message: "Ô chữ cần 2–10 từ nối được với nhau theo thứ tự nhập." });
    }
    if (template === "matching-pairs" && (items.length < 2 || items.length > 12 ||
      new Set(items.map(item => normalize(item.answers[0] ?? ""))).size !== items.length)) {
      context.addIssue({ code: "custom", message: "Cần 2–12 cặp có mặt sau khác nhau." });
    }
    items.forEach(({ answers, options, prompt, alternatives, optionMedia }, index) => {
      const unique = new Set(options.map(normalize));
      const valid = kind === "choice"
        ? options.length >= 2 && unique.size === options.length && (template !== "gameshow" || !unique.has(doubleMarker)) && answers.length >= 1 &&
          new Set(answers.map(normalize)).size === answers.length && answers.every(answer => unique.has(normalize(answer))
          ) && answers.length < options.length
        : options.length === 0 && (kind === "prompt" ? answers.length === 0
          : kind === "sequence" ? answers.length >= 2
          : answers.length === 1 && (kind !== "word" || /^[\p{L}\p{M}]{2,20}$/u.test(answers[0]))
            && (kind !== "blank" || prompt.includes("___")));
      if (!valid || (englishPuzzle && !englishPuzzleWord.safeParse(answers[0]).success) ||
        (template === "true-false" && (answers.length !== 1 || !truthOptions.every(option => unique.has(normalize(option))) || options.length !== 2))) context.addIssue({ code: "custom", path: [index], message: `Kiểm tra nội dung mục ${index + 1} theo yêu cầu của mẫu.` });
      if ((alternatives?.length && kind !== "blank" && template !== "type-answer") ||
          (optionMedia?.length && (kind !== "choice" || optionMedia.some(entry => !unique.has(normalize(entry.option)))))) {
        context.addIssue({ code: "custom", path: [index], message: `Kiểm tra đáp án thay thế và phương tiện của mục ${index + 1}.` });
      }
    });
  });
}

export function compatible(source: Template, target: Template, content: Item[]) {
  const from = templates[source].kind;
  const to = templates[target].kind;
  const wordToText = (from === "word" && to === "text") || (from === "text" && to === "word");
  return (from === to || wordToText) && contentSchema(target).safeParse(content).success;
}
