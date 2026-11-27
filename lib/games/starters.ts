import { z } from "zod";

export const starterPapers = { listening: "Listening", reading: "Reading & Writing", speaking: "Speaking" } as const;
export type StarterPaper = keyof typeof starterPapers;
export const starterPaperSchema = z.enum(["listening", "reading", "speaking"]);
export const starterImage = z.string().regex(/^\/illustrations\/(?:starters|movers|flyers)\/[a-z0-9-]+\.webp$/);
export const starterAudio = z.string().regex(/^\/audio\/(?:starters\/l[1-4]|(?:movers|flyers)\/l[1-5])(?:-[1-5])?\.wav$/);
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
const flyerCounts = { listening: [5, 5, 5, 5, 5], reading: [10, 5, 6, 10, 7, 5, 1], speaking: [1, 1, 1, 1] };
export const flyerPartNames = {
  listening: moverPartNames.listening,
  reading: ["Ghép 15 từ với định nghĩa", "Hoàn thành hội thoại A–H", "Điền từ và chọn tiêu đề", "Điền từ theo ngữ pháp",
    "Hoàn thành câu theo truyện", "Điền từ vào thư, không có khung từ", "Viết truyện theo ba tranh"],
  speaking: ["Mô tả bốn điểm khác nhau", "Hỏi và trao đổi thông tin", "Kể tiếp câu chuyện", "Trả lời câu hỏi cá nhân"],
} as const;
export const cambridgeLevels = { starters: "Pre A1 Starters", movers: "A1 Movers", flyers: "A2 Flyers" } as const;
export const cambridgeLevelSchema = z.enum(["starters", "movers", "flyers"]);
export type CambridgeLevel = keyof typeof cambridgeLevels;
export const cambridgePartNames = { starters: starterPartNames, movers: moverPartNames, flyers: flyerPartNames };
const cardSchema = z.object({ value: z.string().max(30), image: starterImage });
export const starterConfig = z.object({
  paper: starterPaperSchema, part: z.number().int().min(1).max(7), mock: z.boolean(),
  level: z.enum(["movers", "flyers"]).optional(),
  scene: starterImage.optional(), passage: z.string().max(1400).optional(), letters: z.string().max(16).optional(),
  cards: z.array(cardSchema).max(8).optional(),
  targets: z.array(z.object({ id: z.string().max(12), x: z.number().min(0).max(100), y: z.number().min(0).max(100),
    mask: starterImage.optional() })).max(8).optional(),
  example: z.string().trim().max(350).optional(), guide: z.string().trim().max(1200).optional(),
  teacher: z.string().trim().max(1200).optional(),
  lead: cardSchema.optional(), fields: z.array(z.string().max(60)).length(5).optional(), choices: z.array(z.string().trim().min(1).max(120)).length(3).optional(),
  copyWord: z.boolean().optional(), open: z.boolean().optional(), sign: z.boolean().optional(),
  signPosition: z.enum(["left", "right"]).optional(),
  visuals: z.array(starterImage).min(2).max(4).optional(),
  groups: z.array(z.array(starterImage).length(4)).length(4).optional(),
  wordBank: z.array(z.string().trim().min(1).max(45)).min(3).max(15).optional(),
  responses: z.array(z.string().trim().min(1).max(120)).length(8).optional(),
  exchange: z.object({
    learner: cardSchema, examiner: cardSchema,
    rows: z.array(z.object({ label: z.string().min(1).max(80), value: z.string().min(1).max(80) })).length(5),
  }).optional(),
});
export type CambridgePart = z.infer<typeof starterConfig>;
export function cambridgeCounts({ level, paper }: Pick<CambridgePart, "level" | "paper">) {
  return level === "flyers" ? flyerCounts[paper] : level === "movers" ? moverCounts[paper] : starterPartNames[paper].map(() => paper === "speaking" ? 1 : 5);
}
export const starterSeconds: Record<StarterPaper, number> = { listening: 1200, reading: 1200, speaking: 300 };
export const moverSeconds: Record<StarterPaper, number> = { listening: 1500, reading: 1800, speaking: 420 };
export const cambridgeSeconds = { starters: starterSeconds, movers: moverSeconds, flyers: { listening: 1500, reading: 2400, speaking: 540 } };
export const cambridgeResponseLimit = (part: CambridgePart) => part.open ? (part.level === "flyers" ? 800 : 240) : part.choices ? 120 : 40;
export function starterProjection(config: CambridgePart) {
  const { paper, part, mock, level, scene, passage, letters, cards, targets, example, guide, lead, fields, choices, copyWord, open, sign, signPosition,
    visuals, groups, wordBank, responses, exchange } = config;
  return { paper, part, mock, level, scene, passage, letters, cards, targets, example, guide: mock ? undefined : guide,
    lead, fields, choices, copyWord, open, sign, signPosition, visuals, groups, wordBank, responses, exchange };
}
