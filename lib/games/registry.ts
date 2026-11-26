import { z } from "zod";
import { wordTemplates } from "./word-templates";

export const legacyTemplates = {
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
export const templates = { ...legacyTemplates, ...wordTemplates };
export const legacyIds = Object.keys(legacyTemplates) as (keyof typeof legacyTemplates)[];
export type Template = keyof typeof templates;
export const templateIds = Object.keys(templates) as Template[];
export const templateSchema = z.enum(templateIds);
export const isTemplate = (value: string): value is Template => Object.hasOwn(templates, value);
