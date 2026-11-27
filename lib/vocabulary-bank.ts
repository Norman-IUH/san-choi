import { z } from "zod";
import { contentSchema, levels, mediaPath, normalize, sampleAudioPath, sampleImagePath, skills, templates, type Item, type Template } from "./game";
import { difficultyLevels, isArcadeTemplate, type Difficulty } from "./games/arcade-templates";
import { pairOptions } from "./games/puzzle-templates";
import { truthOptions } from "./games/word-templates";

const required = (length: number) => z.string().trim().normalize().min(1).max(length);
const optional = (length: number) => z.string().trim().normalize().max(length).default("");
const image = mediaPath.refine(path => /\.(png|jpg|webp)$/.test(path));
const audio = mediaPath.refine(path => /\.(mp3|wav|ogg)$/.test(path));

export const bankWordSchema = z.object({
  word: required(100), meaning: required(240), level: z.enum(levels), topic: required(80),
  part: optional(40), ipa: optional(100), example: optional(400), related: optional(240),
  image: z.union([image, sampleImagePath]).nullish(), uk: z.union([audio, sampleAudioPath]).nullish(), us: z.union([audio, sampleAudioPath]).nullish(),
});
export type BankWord = z.infer<typeof bankWordSchema> & { id: string; archived_at?: string | null };

export const lessonSchema = z.object({
  title: required(100), level: z.enum(levels), skill: z.enum(skills), topic: required(80), unit: required(80),
  difficulty: z.enum(difficultyLevels),
  entry_keys: z.array(required(160)).max(60).refine(keys => new Set(keys).size === keys.length),
});
export type VocabularyLesson = z.infer<typeof lessonSchema>;
export const difficultyLabels = { gentle: "Chậm", steady: "Tiêu chuẩn", challenge: "Nâng cao" } as const;

export const bankColumns = ["word", "meaning", "level", "topic", "part", "ipa", "example", "related"] as const;

export function importBankRows(rows: readonly unknown[][], defaults: Pick<BankWord, "level" | "topic">) {
  const [header, ...data] = rows;
  const cols = header?.map(cell => typeof cell === "string" ? cell.trim().toLowerCase() : "") ?? [];
  if (!cols.includes("word") || !cols.includes("meaning") || new Set(cols.filter(Boolean)).size !== cols.filter(Boolean).length) {
    throw new Error("Cần cột word và meaning. Tên cột không được trùng.");
  }
  const filled = data.filter(row => row.some(cell => cell != null && String(cell).trim() !== ""));
  if (!filled.length || filled.length > 1000) throw new Error("Chọn tệp có 1–1000 dòng dữ liệu.");
  const keys = new Set<string>();
  return filled.map((row, index) => {
    const fields = Object.fromEntries(bankColumns.map(column => {
      const value = row[cols.indexOf(column)];
      return [column, typeof value === "string" || typeof value === "number" ? String(value).trim() : ""];
    }));
    const parsed = bankWordSchema.safeParse({ ...fields, level: fields.level || defaults.level, topic: fields.topic || defaults.topic });
    if (!parsed.success) throw new Error(`Dòng ${index + 2} có từ, nghĩa hoặc phân loại chưa hợp lệ.`);
    const key = JSON.stringify([parsed.data.level, normalize(parsed.data.word), normalize(parsed.data.meaning)]);
    if (keys.has(key)) throw new Error(`Dòng ${index + 2} trùng từ, nghĩa và cấp độ.`);
    keys.add(key);
    return parsed.data;
  });
}

export function wordItem(word: BankWord, skill: VocabularyLesson["skill"] = "Vocabulary"): Item {
  return {
    version: 2, prompt: word.word, answers: [word.meaning], options: [],
    media: word.image ? { image: word.image } : undefined,
    english: { level: word.level, skill, meaning: word.meaning, ipa: word.ipa || undefined,
      example: word.example || undefined, uk: word.uk || undefined, us: word.us || undefined },
  };
}

export function vocabularyGame(template: Template, words: BankWord[], skill: VocabularyLesson["skill"], difficulty: Difficulty) {
  if (!words.length) return null;
  const kind = templates[template].kind;
  const choices = [...new Map(words.map(word => [normalize(word.word), word])).values()];
  const topics = [...new Set(words.map(word => word.topic))];
  if (template === "labelled-diagram" || template === "maths-generator" || template === "rank-order") return null;
  if (template === "watch-memorize" && (choices.length !== words.length || choices.length < 2 || choices.length > 8)) return null;
  if (["group-sort", "speed-sorting"].includes(template) && topics.length < 2) return null;

  const items = template === "watch-memorize" ? [{ ...wordItem(words[0], skill), prompt: "Nhớ thứ tự các từ",
    answers: choices.map(entry => entry.word).slice(0, 8) }] : words.map((word, index): Item => {
    const item = wordItem(word, skill);
    const others = choices.filter(entry => normalize(entry.word) !== normalize(word.word));
    if (template === "group-sort") return { ...item, answers: [word.topic] };
    if (template === "speed-sorting") return { ...item, answers: [word.topic], options: topics };
    if (template === "true-false" || template === "pair-or-no-pair") {
      const different = others.find(entry => normalize(entry.meaning) !== normalize(word.meaning));
      const correct = index % 2 === 0 || !different;
      const meaning = correct ? word.meaning : different.meaning;
      if (template === "pair-or-no-pair") return { ...item, secondary: meaning, options: [...pairOptions], answers: [pairOptions[correct ? 0 : 1]] };
      return { ...item, prompt: `${word.word} nghĩa là “${meaning}”.`, options: [...truthOptions], answers: [truthOptions[correct ? 0 : 1]] };
    }
    if (kind === "choice") {
      const pool = [word, ...others.filter(other => template !== "image-quiz" || other.image).slice(0, 3)];
      return { ...item, prompt: word.meaning, answers: [word.word], options: pool.map(entry => entry.word),
        optionMedia: pool.flatMap(entry => entry.image ? [{ option: entry.word, image: entry.image }] : []),
        arcade: isArcadeTemplate(template) ? { difficulty, timed: false } : undefined };
    }
    if (kind === "prompt") return { ...item, answers: [] };
    if (kind === "pair") return item;
    if (kind === "sequence") return { ...item, prompt: word.meaning, answers: word.example.split(/\s+/).filter(Boolean) };
    if (kind === "blank") {
      const escaped = word.word.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
      return { ...item, prompt: word.example.replace(new RegExp(`\\b${escaped}\\b`, "i"), "___"), answers: [word.word] };
    }
    return { ...item, prompt: word.meaning, answers: [word.word] };
  });
  const parsed = contentSchema(template).safeParse(items);
  return parsed.success ? parsed.data : null;
}
