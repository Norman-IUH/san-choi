import { z } from "zod";

export const starterPapers = { listening: "Listening", reading: "Reading & Writing", speaking: "Speaking" } as const;
export type StarterPaper = keyof typeof starterPapers;
export const starterPaperSchema = z.enum(["listening", "reading", "speaking"]);
export const starterImage = z.string().regex(/^\/illustrations\/(?:starters|movers)\/[a-z0-9-]+\.webp$/);
export const starterAudio = z.string().regex(/^\/audio\/(?:starters\/l[1-4]|movers\/l[1-5])(?:-[1-5])?\.wav$/);
export const starterPartNames = {
  listening: ["Nối tên với người", "Nghe và viết tên hoặc số", "Chọn hình đúng", "Tô màu theo lời nghe"],
  reading: ["Đánh dấu đúng hoặc sai", "Đọc tranh và viết yes hoặc no", "Xếp chữ thành từ", "Điền từ vào đoạn văn", "Viết một từ theo truyện tranh"],
  speaking: ["Chỉ và đặt thẻ", "Nói về tranh lớn", "Nói về thẻ đồ vật", "Trả lời câu hỏi cá nhân"],
} as const;
export const moverPartNames = {
  listening: ["Nối tên với người", "Điền phiếu thông tin", "Ghép hai bộ hình", "Chọn hình đúng", "Tô màu và viết từ"],
  reading: ["Ghép định nghĩa với từ", "Hoàn thành hội thoại", "Điền từ và chọn tiêu đề", "Điền từ theo ngữ pháp", "Hoàn thành câu theo truyện", "Viết về tranh"],
  speaking: ["Mô tả bốn điểm khác nhau", "Kể tiếp câu chuyện", "Tìm hình khác nhóm", "Trả lời câu hỏi cá nhân"],
} as const;
const moverCounts = { listening: [5, 5, 5, 5, 5], reading: [5, 6, 6, 5, 7, 6], speaking: [1, 1, 1, 1] };
export const cambridgeLevels = { starters: "Pre A1 Starters", movers: "A1 Movers" } as const;
const cardSchema = z.object({ value: z.string().max(30), image: starterImage });
export const starterConfig = z.object({
  paper: starterPaperSchema, part: z.number().int().min(1).max(6), mock: z.boolean(),
  level: z.literal("movers").optional(),
  scene: starterImage.optional(), passage: z.string().max(1400).optional(), letters: z.string().max(16).optional(),
  cards: z.array(cardSchema).max(8).optional(),
  targets: z.array(z.object({ id: z.string().max(12), x: z.number().min(0).max(100), y: z.number().min(0).max(100) })).max(8).optional(),
  example: z.string().trim().max(350).optional(), guide: z.string().trim().max(1200).optional(),
  teacher: z.string().trim().max(1200).optional(),
  lead: cardSchema.optional(), fields: z.array(z.string().max(60)).length(5).optional(), choices: z.array(z.string().trim().min(1).max(120)).length(3).optional(),
  copyWord: z.boolean().optional(), open: z.boolean().optional(), sign: z.boolean().optional(),
  visuals: z.array(starterImage).min(2).max(4).optional(),
  groups: z.array(z.array(starterImage).length(4)).length(4).optional(),
});
export type CambridgePart = z.infer<typeof starterConfig>;
export function cambridgeCounts({ level, paper }: Pick<CambridgePart, "level" | "paper">) {
  return level === "movers" ? moverCounts[paper] : starterPartNames[paper].map(() => paper === "speaking" ? 1 : 5);
}
export const starterSeconds: Record<StarterPaper, number> = { listening: 1200, reading: 1200, speaking: 300 };
export const moverSeconds: Record<StarterPaper, number> = { listening: 1500, reading: 1800, speaking: 420 };
export const cambridgeResponseLimit = (part: CambridgePart) => part.open ? 240 : part.choices ? 120 : 40;
export function starterProjection(config: CambridgePart) {
  const { paper, part, mock, level, scene, passage, letters, cards, targets, example, guide, lead, fields, choices, copyWord, open, sign, visuals, groups } = config;
  return { paper, part, mock, level, scene, passage, letters, cards, targets, example, guide: mock ? undefined : guide,
    lead, fields, choices, copyWord, open, sign, visuals, groups };
}
