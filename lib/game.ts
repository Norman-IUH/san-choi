import { z } from "zod";

export const templates = {
  quiz: { title: "Trắc nghiệm", kind: "choice", icon: "?", color: "violet" },
  "match-up": { title: "Ghép cặp", kind: "pair", icon: "↔", color: "mint" },
  "flash-cards": { title: "Thẻ ghi nhớ", kind: "pair", icon: "▱", color: "peach" },
  speaking: { title: "Thẻ luyện nói", kind: "prompt", icon: "❞", color: "blue" },
  sentence: { title: "Điền từ vào câu", kind: "blank", icon: "…", color: "violet" },
  "group-sort": { title: "Phân loại", kind: "pair", icon: "▦", color: "mint" },
  wheel: { title: "Vòng quay", kind: "prompt", icon: "◉", color: "peach" },
  "find-match": { title: "Tìm đáp án ghép", kind: "pair", icon: "◎", color: "blue" },
  gameshow: { title: "Đố vui sân khấu", kind: "choice", icon: "★", color: "violet" },
  unjumble: { title: "Sắp xếp câu", kind: "sequence", icon: "⇄", color: "mint" },
  anagram: { title: "Xếp chữ", kind: "word", icon: "Aa", color: "peach" },
  "open-box": { title: "Mở hộp bí mật", kind: "prompt", icon: "◇", color: "blue" },
} as const;
export type Template = keyof typeof templates;
export const templateIds = Object.keys(templates) as Template[];
export const templateSchema = z.enum(templateIds);
export const isTemplate = (value: string): value is Template => Object.hasOwn(templates, value);
const text = z.string().trim().min(1).max(400);
export const levels = ["Kids", "Pre A1 Starters", "A1 Movers", "A2 Flyers"] as const;
export const skills = ["Vocabulary", "Phonics", "Listening", "Speaking", "Reading", "Writing", "Grammar"] as const;
export const mediaPath = z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp|mp3|wav|ogg)$/);
const imagePath = mediaPath.refine(path => /\.(png|jpg|webp)$/.test(path));
const audioPath = mediaPath.refine(path => /\.(mp3|wav|ogg)$/.test(path));
export const sampleAudioPath = z.string().regex(/^\/audio\/vocabulary\/[a-z]+-(uk|us)\.wav$/);
const mediaSchema = z.object({ image: imagePath.optional(), audio: audioPath.optional() });
const englishSchema = z.object({
  level: z.enum(levels).optional(),
  skill: z.enum(skills).optional(),
  meaning: text.optional(),
  ipa: z.string().trim().min(1).max(100).optional(),
  example: text.optional(),
  uk: z.union([audioPath, sampleAudioPath]).optional(),
  us: z.union([audioPath, sampleAudioPath]).optional(),
});
export const itemSchema = z.object({
  version: z.literal(2).optional(),
  prompt: text,
  answers: z.array(text).max(16),
  options: z.array(text).max(8).default([]),
  english: englishSchema.optional(),
  media: mediaSchema.optional(),
  optionMedia: z.array(z.object({ option: text, ...mediaSchema.shape })).max(8).optional(),
  explanation: z.string().trim().min(1).max(800).optional(),
  alternatives: z.array(text).max(8).optional(),
});
export type Item = z.infer<typeof itemSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type PlayItem = {
  prompt: string; options: string[]; multiple?: boolean;
  media?: Media; optionMedia?: Item["optionMedia"]; pronunciation?: Pick<NonNullable<Item["english"]>, "uk" | "us">;
  vocabulary?: Pick<NonNullable<Item["english"]>, "ipa" | "example">;
};
export const doubleMarker = "★ nhân đôi";
export type ReviewEntry = { prompt: string; selected: string[]; expected: string[]; explanation?: string };

export function missedReview(items: Item[], submitted: { answer: string[]; correct: boolean | null }[]): ReviewEntry[] {
  return submitted.flatMap(({ answer, correct }, index) => {
    const item = items[index];
    return item && correct === false ? [{ prompt: item.prompt, selected: answer.filter(value => value !== doubleMarker),
      expected: [...item.answers, ...(item.alternatives ?? [])], explanation: item.explanation }] : [];
  });
}

export function normalize(value: string) {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");
}

export function contentSchema(template: Template, draft = false) {
  return z.array(itemSchema).min(draft ? 0 : 1).max(60).superRefine((items, context) => {
    if (draft) return;
    const kind = templates[template].kind;
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
      if (!valid) context.addIssue({ code: "custom", path: [index], message: `Kiểm tra nội dung mục ${index + 1} theo yêu cầu của mẫu.` });
      if ((alternatives?.length && kind !== "blank") ||
          (optionMedia?.length && (kind !== "choice" || optionMedia.some(entry => !unique.has(normalize(entry.option)))))) {
        context.addIssue({ code: "custom", path: [index], message: `Kiểm tra đáp án thay thế và phương tiện của mục ${index + 1}.` });
      }
    });
  });
}

export function compatible(source: Template, target: Template, content: Item[]) {
  return templates[source].kind === templates[target].kind && contentSchema(target).safeParse(content).success;
}

export function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function makePlayItems(template: Template, items: Item[]): PlayItem[] {
  const kind = templates[template].kind;
  const pairOptions = kind === "pair" && template !== "flash-cards"
    ? shuffle([...new Set(items.map(item => item.answers[0]))]) : [];
  return items.map(item => ({
    prompt: template === "open-box" ? "" : item.prompt,
    media: item.media,
    optionMedia: item.optionMedia?.map(entry => ({
      ...entry, option: item.options.find(option => normalize(option) === normalize(entry.option)) ?? entry.option,
    })),
    pronunciation: item.english ? { uk: item.english.uk, us: item.english.us } : undefined,
    vocabulary: template === "flash-cards" && item.english ? { ipa: item.english.ipa, example: item.english.example } : undefined,
    ...(kind === "choice" && { multiple: item.answers.length > 1 }),
    options: kind === "choice" ? shuffle(item.options) :
      kind === "sequence" ? shuffle(item.answers) :
      kind === "word" ? shuffle(Array.from(item.answers[0].normalize("NFC"))) : pairOptions,
  }));
}

export function grade(template: Template, items: Item[], responses: string[][]) {
  const kind = templates[template].kind;
  const doubleIndex = template === "gameshow" ? responses.findIndex(response => response.at(-1) === doubleMarker) : -1;
  const correct = items.map((item, index) => {
    if (kind === "prompt" || template === "flash-cards") return null;
    const expected = item.answers.map(normalize);
    const response = responses[index] ?? [];
    const actual = (index === doubleIndex ? response.slice(0, -1) : response).map(normalize);
    if (kind === "word") return actual.join("") === expected[0];
    if (kind === "blank" && actual.length === 1) return [...expected, ...(item.alternatives ?? []).map(normalize)].includes(actual[0]);
    if (kind === "choice") {
      expected.sort();
      actual.sort();
    }
    return expected.length === actual.length && expected.every((answer, position) => answer === actual[position]);
  });
  return { correct, score: correct.every(value => value === null) ? null : correct.filter(Boolean).length + Number(correct[doubleIndex] === true),
    total: correct.filter(value => value !== null).length + Number(doubleIndex >= 0 && doubleIndex < items.length) };
}
