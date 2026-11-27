import { z } from "zod";
import { templates, type Template } from "./registry";
import { itemSchema, normalize, type Item } from "./model";
import { englishPuzzleWord, truthOptions } from "./word-templates";
import { buildCrossword } from "./word-puzzles";
import { isArcadeTemplate, riskMarker } from "./arcade-templates";
import { pairOptions } from "./puzzle-templates";
import { doubleMarker } from "./scoring";
import { colourPalette, grammarTemplates, isAudioPractice, isPhonics, isReading, practiceTemplate, samplePracticeAudio } from "./practice";
import { isProductive, isSpeaking } from "./productive";
import { starterAudio, starterPartNames } from "./starters";

export function contentSchema(template: Template, draft = false) {
  return z.array(itemSchema).min(draft ? 0 : 1).max(60).superRefine((items, context) => {
    if (draft) return;
    const kind = templates[template].kind;
    const starters = items[0]?.practice?.starters;
    if (items.some(item => item.practice?.mode === "starters")) {
      const speaking = starters?.paper === "speaking";
      const count = starters?.mock ? starterPartNames[starters.paper].length * (speaking ? 1 : 5) : speaking ? 1 : 5;
      if (!starters || items.length !== count || template !== (speaking ? "speaking" : "type-answer") ||
        (speaking && (!items[0].practice?.production?.rubric || items[0].practice.production.objective)) || items.some((item, index) => {
          const config = item.practice?.starters;
          return item.practice?.mode !== "starters" || !config || config.paper !== starters.paper || config.mock !== starters.mock ||
            config.part > starterPartNames[starters.paper].length || config.part !== (starters.mock ? Math.floor(index / (speaking ? 1 : 5)) + 1 : starters.part) ||
            item.answers.length !== (speaking ? 0 : 1) || (config.paper === "listening" && !starterAudio.safeParse(item.media?.audio).success);
        })) context.addIssue({ code: "custom", message: "Kiểm tra cấu trúc đề Starters và học liệu từng phần." });
      return;
    }
    const englishPuzzle = template === "wordsearch" || template === "spell-word" || template === "hangman" || template === "crossword";
    if (template === "crossword" && (items.length > 10 || !buildCrossword(items.map(item => item.answers[0] ?? "")))) {
      context.addIssue({ code: "custom", message: "Ô chữ cần 2–10 từ nối được với nhau theo thứ tự nhập." });
    }
    if (template === "matching-pairs" && (items.length < 2 || items.length > 12 ||
      new Set(items.map(item => normalize(item.answers[0] ?? ""))).size !== items.length)) {
      context.addIssue({ code: "custom", message: "Cần 2–12 cặp có mặt sau khác nhau." });
    }
    const matching = items.filter(item => item.practice?.mode === "listen-match");
    const productive = items.find(item => item.practice && isProductive(item.practice.mode))?.practice;
    if (productive && (items.some(item => item.practice?.mode !== productive.mode ||
      item.practice?.production?.objective !== productive.production?.objective) || items.length > 12 ||
      (!productive.production?.objective && !items[0].practice?.production?.rubric) ||
      items.slice(1).some(item => item.practice?.production?.rubric))) {
      context.addIssue({ code: "custom", message: "Bài luyện cần 1–12 câu cùng dạng, cách chấm nhất quán và một rubric cho bài chấm thủ công." });
    }
    const reading = items.find(item => item.practice && isReading(item.practice.mode))?.practice;
    if (reading && (items.some(item => item.practice?.mode !== reading.mode) || !reading.stimulusKind ||
      (!reading.stimulus && !reading.stimulusImage) || (reading.mode === "picture-reading" && !reading.stimulusImage) ||
      items.slice(1).some(item => item.practice?.stimulus || item.practice?.stimulusKind || item.practice?.stimulusImage))) {
      context.addIssue({ code: "custom", message: "Bài Reading cần một ngữ liệu chung và các câu cùng dạng bài." });
    }
    if (matching.length > 1 && (matching.length !== items.length || matching.length > 8 ||
      new Set(matching.map(item => normalize(item.answers[0] ?? ""))).size !== matching.length ||
      matching.some(item => item.practice?.pictureChoices || item.options.length !== matching[0].options.length ||
        !matching[0].options.every(option => item.options.includes(option)) || matching.some(row =>
          !item.options.some(option => normalize(option) === normalize(row.answers[0] ?? "")))))) {
      context.addIssue({ code: "custom", message: "Bảng ghép cần 2–8 clip, mỗi clip có đáp án riêng và chọn từ cùng bộ thẻ." });
    }
    items.forEach(({ answers, options, prompt, alternatives, optionMedia, media, pin, secondary, math, arcade, practice }, index) => {
      const unique = new Set(options.map(normalize));
      const response = practice?.production;
      if (practice && isProductive(practice.mode)) {
        const objective = response?.objective ?? false;
        const speaks = isSpeaking(practice.mode);
        const needsPicture = ["describe-picture", "picture-differences", "picture-writing"].includes(practice.mode);
        if (!response || (speaks && objective) || (objective && response.rubric) ||
          template !== (objective ? "type-answer" : "speaking") || options.length ||
          (objective ? answers.length !== 1 || [...answers, ...(alternatives ?? [])].some(answer => answer.length > response.limit ||
            normalize(response.example ?? "").includes(normalize(answer))) : answers.length || alternatives?.length) ||
          (needsPicture && !media?.image) || (practice.mode === "picture-differences" && !practice.stimulusImage)) {
          context.addIssue({ code: "custom", path: [index], message: `Kiểm tra ngữ liệu và cách chấm của mục ${index + 1}.` });
        }
        return;
      }
      if (response) context.addIssue({ code: "custom", path: [index], message: "Cấu hình câu trả lời chỉ dành cho Speaking và Writing." });
      const exposesDictation = practice?.mode === "dictation" && [...answers, ...(alternatives ?? [])]
        .some(answer => normalize(prompt + " " + (practice.stimulus ?? "")).includes(normalize(answer)));
      if (practice && ((practice.mode === "grammar" ? !grammarTemplates.some(id => template === id) : practiceTemplate(practice.mode) !== template) ||
        (isAudioPractice(practice.mode) && (!media?.audio || answers.length !== 1)) ||
        (isPhonics(practice.mode) && (!practice.reviewedAudio || samplePracticeAudio.safeParse(media?.audio).success)) ||
        (practice.mode === "colour" && (!media?.image || options.some(option => !Object.hasOwn(colourPalette, normalize(option))))) ||
        (practice.showTranscript && (practice.mode !== "dialogue" || !practice.transcript)) ||
        (practice.regions && (practice.mode !== "colour" || !practice.correctRegion || practice.correctRegion > practice.regions.length ||
          new Set(practice.regions.map(({ x, y }) => `${x},${y}`)).size !== practice.regions.length ||
          practice.regions.some(({ x, y, width, height }) => x < width / 2 || 100 - x < width / 2 || y < height / 2 || 100 - y < height / 2))) ||
        (practice.correctRegion && !practice.regions) || exposesDictation)) {
        context.addIssue({ code: "custom", path: [index], message: `Kiểm tra clip, đáp án và tùy chọn của bài luyện mục ${index + 1}.` });
      }
      const valid = template === "maths-generator"
        ? Boolean(math && math.min <= math.max && (math.operation !== "divide" || math.min >= 1) && !answers.length && !options.length)
        : kind === "choice"
        ? options.length >= 2 && unique.size === options.length && (template !== "gameshow" || !unique.has(doubleMarker)) && answers.length >= 1 &&
          new Set(answers.map(normalize)).size === answers.length && answers.every(answer => unique.has(normalize(answer))
          ) && answers.length < options.length
        : options.length === 0 && (kind === "prompt" ? answers.length === 0
          : kind === "sequence" ? answers.length >= 2
          : answers.length === 1 && (kind !== "word" || /^[\p{L}\p{M}]{2,20}$/u.test(answers[0]))
            && (kind !== "blank" || prompt.includes("___")));
      const requiresPicture = (template === "image-quiz" || practice?.pictureChoices) && options.some(option =>
        !optionMedia?.some(entry => entry.image && normalize(entry.option) === normalize(option) &&
          (!practice?.pictureChoices || !entry.image.startsWith("/") || /^\/illustrations\/practice\/[a-f0-9]{12}\.webp$/.test(entry.image))));
      const invalidDiagram = template === "labelled-diagram" && (!pin || !media?.image || answers.length !== 1);
      const invalidPair = template === "pair-or-no-pair" && (!secondary || answers.length !== 1 || options.length !== 2 ||
        !pairOptions.every(option => unique.has(normalize(option))));
      if (!valid || (isArcadeTemplate(template) ? answers.length !== 1 || unique.has(riskMarker) : Boolean(arcade)) || requiresPicture || invalidDiagram || invalidPair ||
        (pin && template !== "labelled-diagram") || (secondary && template !== "pair-or-no-pair") ||
        (math && template !== "maths-generator") || (englishPuzzle && !englishPuzzleWord.safeParse(answers[0]).success) ||
        (template === "image-quiz" && answers.length !== 1) ||
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
