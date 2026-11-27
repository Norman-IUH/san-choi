import { z } from "zod";
import { buildCrossword, makeWordsearch, type Cell, type CrosswordGrid } from "./games/word-puzzles";
import { isArcadeTemplate } from "./games/arcade-templates";
import { cambridgePartNames, starterPapers } from "./games/starters";
import { isAudioPractice } from "./games/practice";
import type { Item, Template } from "./game";

export const paperOptions = z.object({
  title: z.string().trim().max(140).default(""),
  student: z.string().trim().max(80).default(""),
  className: z.string().trim().max(80).default(""),
  date: z.string().max(30).default(""),
  instructions: z.string().trim().max(1000).default(""),
  fontSize: z.enum(["10", "12", "14", "16"]).default("12"),
  paper: z.enum(["A4", "Letter"]).default("A4"),
  colour: z.boolean().default(true),
  version: z.enum(["worksheet", "key", "transcript"]).default("worksheet"),
});
export type PaperOptions = z.infer<typeof paperOptions>;
type Figure = { path: string; label?: string; pins?: { x: number; y: number; id: string }[] };
type Grid = { width: number; height: number; cells: (Cell & { value?: string; number?: string; marked?: boolean })[] };
export type PaperBlock = { heading?: string; text?: string; figures?: Figure[]; grid?: Grid; lines?: number; card?: boolean };
export type PaperDocument = { title: string; heading: string; blocks: PaperBlock[]; cards?: boolean };
export const printableTemplates = ["quiz", "match-up", "flash-cards", "wordsearch", "crossword", "hangman", "anagram", "group-sort",
  "unjumble", "sentence", "type-answer", "spell-word", "image-quiz", "true-false", "speaking", "word-magnets"] satisfies Template[];

export function canPrint(template: Template, items: Item[]) {
  return !isArcadeTemplate(template) && (printableTemplates.some(id => id === template) || items.some(item => !!item.practice));
}

function mix(words: string[], salt: number) {
  const ordered = words.map((word, i) => ({ word, value: [...word].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261 + salt + i) >>> 0 }))
    .sort((a, b) => a.value - b.value).map(row => row.word);
  return ordered.length > 1 && ordered.every((word, i) => word === words[i]) ? [...ordered.slice(1), ordered[0]] : ordered;
}

function crossword(items: Item[], puzzle: CrosswordGrid, key: boolean): PaperBlock {
  const cells = new Map<string, Grid["cells"][number]>();
  puzzle.slots.forEach((slot, i) => slot.cells.forEach((cell, j) => {
    const id = cell.row + "/" + cell.column;
    const current = cells.get(id) ?? { ...cell, value: key ? items[i].answers[0][j].toUpperCase() : undefined };
    if (j === 0) current.number = [current.number, String(i + 1)].filter(Boolean).join("/");
    cells.set(id, current);
  }));
  return { heading: "Ô chữ", grid: { width: puzzle.width, height: puzzle.height, cells: [...cells.values()] } };
}

export function worksheet(title: string, template: Template, items: Item[], version: PaperOptions["version"],
  transcripts: Readonly<Record<string, string>> = {}): PaperDocument {
  const key = version === "key";
  const first = items[0]?.practice?.starters;
  const paperName = first ? starterPapers[first.paper] : "";
  const heading = version === "transcript" ? "Transcript dành cho giáo viên" : key ? "Đáp án dành cho giáo viên" : paperName || "Phiếu bài tập";
  const blocks: PaperBlock[] = [];
  if (version === "transcript") {
    const clips = new Set<string>();
    items.forEach((item, index) => {
      const clip = item.media?.audio;
      if (clip && clips.has(clip)) return;
      const text = item.practice?.transcript ?? (clip ? transcripts[clip] : undefined);
      if (!clip && !text) return;
      if (clip) clips.add(clip);
      blocks.push({ heading: `Bản nghe mục ${index + 1}`, text: text ?? "Chưa có transcript đã lưu cho bản nghe này." });
    });
    return { title, heading, blocks };
  }
  const cards = template === "flash-cards" && !first;
  const puzzle = template === "crossword" ? buildCrossword(items.map(item => item.answers[0] ?? "")) : null;
  if (puzzle) blocks.push(crossword(items, puzzle, key));
  if (key && items[0]?.practice?.production?.rubric) {
    blocks.push({ heading: "Rubric nội bộ", text: items[0].practice.production.rubric.map(row => `${row.title} · ${row.max} điểm · ${row.description}`).join("\n") });
  }
  if (!key && (template === "match-up" || template === "group-sort") && !first && !items.some(item => item.practice?.regions)) {
    const bank = mix([...new Set(items.map(item => item.answers[0]).filter(Boolean))], 15);
    if (bank.length) blocks.push({ heading: template === "group-sort" ? "Các nhóm để chọn" : "Cột B · Ghép vào câu ở cột A",
      text: bank.map((value, i) => `${i + 1}. ${value}`).join("     ") });
  }
  const stimuli = new Set<string>();
  let previousPart = 0;
  items.forEach((item, index) => {
    const practice = item.practice;
    const config = practice?.starters;
    const part = config?.part ?? 0;
    if (config && part !== previousPart) {
      blocks.push({ heading: `Part ${part} · ${cambridgePartNames[config.level ?? "starters"][config.paper][part - 1]}` });
      if (!key && config.paper === "listening" && previousPart === 0)
        blocks.push({ text: "Nghe bản audio giáo viên phát cho từng phần rồi làm các câu bên dưới." });
      stimuli.clear();
      previousPart = part;
    }
    if (!key) {
      const text = config?.passage ?? practice?.stimulus;
      if (text && !stimuli.has(text) && !isAudioPractice(practice!.mode)) {
        stimuli.add(text);
        blocks.push({ text });
      }
      const scene = config?.scene ?? practice?.stimulusImage;
      if (scene && !stimuli.has(scene)) {
        stimuli.add(scene);
        blocks.push({ figures: [{ path: scene, pins: config?.targets }] });
      }
      const bank = config?.wordBank ?? config?.responses;
      if (bank && !stimuli.has(bank.join("|"))) {
        stimuli.add(bank.join("|"));
        blocks.push({ heading: config?.responses ? "Câu đáp A–H" : "Khung từ",
          text: config?.responses ? bank.map((value, i) => `${"ABCDEFGH"[i]}. ${value}`).join("\n") : bank.join("    ·    ") });
      }
    }
    const text: string[] = [];
    const figures: Figure[] = [];
    let grid: Grid | undefined;
    if (template === "wordsearch" && item.answers[0]) {
      const search = makeWordsearch(item.answers[0], index);
      grid = { width: search.size, height: search.size, cells: search.grid.map((value, i) => ({
        row: Math.floor(i / search.size), column: i % search.size, value, marked: key && search.positions.includes(i),
      })) };
    }
    if (item.media?.image) figures.push({ path: item.media.image });
    if (key) {
      const alternatives = [...item.answers, ...(item.alternatives ?? [])];
      if (alternatives.length) text.push(alternatives.join(template === "unjumble" || template === "word-magnets" ? " " : " / "));
      if (practice?.correctRegion) text.push(`Vùng ${practice.correctRegion}`);
      if (config?.teacher) text.push(config.teacher);
      if (item.explanation) text.push(item.explanation);
      if (!text.length) text.push("Giáo viên nhận xét.");
    } else {
      if (item.options.length && template !== "match-up" && template !== "group-sort") {
        mix(item.options, index + 1).forEach((option, i) => {
          const label = String.fromCharCode(65 + i);
          const image = item.optionMedia?.find(asset => asset.option === option)?.image;
          if (image) figures.push({ path: image, label: practice?.pictureChoices ? label : `${label}. ${option}` });
          else text.push(`${label}. ${option}`);
        });
      }
      if (template === "unjumble" || template === "word-magnets") text.push(mix(item.answers, index + 1).join("   /   "));
      if (template === "anagram" || template === "spell-word")
        text.push(mix(Array.from(item.answers[0] ?? ""), index + 9).join("   "));
      if (template === "hangman") text.push(Array.from(item.answers[0] ?? "", () => "_").join("   "));
      if (puzzle) text.push(puzzle.slots[index].across ? "Ngang" : "Dọc");
      if (item.english?.ipa && !["hangman", "anagram", "spell-word", "crossword", "wordsearch"].includes(template)) text.push(item.english.ipa);
      if (config?.letters) text.push([...config.letters].join("   "));
      if (config?.choices) text.push(config.choices.join("   /   "));
      if (config?.level === undefined && config?.paper === "reading" && part === 1) text.push("[ ] Đúng     [ ] Sai");
      if (config?.lead) figures.push({ path: config.lead.image, label: config.lead.value });
      const parts = config?.cards ?? [];
      const bankKey = parts.map(card => card.image + card.value).join("|");
      if (parts.length && !stimuli.has(bankKey)) {
        if (parts.length > 3) stimuli.add(bankKey);
        figures.push(...parts.map(card => ({ path: card.image, label: config?.paper === "speaking" ? undefined : card.value })));
      }
      config?.visuals?.forEach((path, i) => figures.push({ path, label: `Tranh ${i + 1}` }));
      if (config?.groups) {
        config.groups.forEach((paths, i) => blocks.push({ heading: `Nhóm ${i + 1}`, figures: paths.map((path, j) => ({ path, label: "ABCD"[j] })) }));
      }
      if (config?.exchange) {
        const { learner, examiner, rows } = config.exchange;
        figures.push({ path: learner.image, label: learner.value }, { path: examiner.image, label: examiner.value });
        text.push(rows.map(row => `${row.label} · ${row.value} / ____`).join("\n"));
      }
    }
    blocks.push({ heading: `${index + 1}. ${item.prompt}`, text: text.join("\n") || undefined, figures, grid, card: cards,
      lines: key || cards || puzzle || grid ? 0 : config?.open ? (config.level === "flyers" ? 8 : 3) :
        config?.paper === "speaking" || template === "speaking" ? 2 : 1 });
  });
  return { title, heading, blocks, cards };
}
