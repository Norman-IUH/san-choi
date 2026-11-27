import { z } from "zod";

export const starterPapers = { listening: "Listening", reading: "Reading & Writing", speaking: "Speaking" } as const;
export type StarterPaper = keyof typeof starterPapers;
export const starterPaperSchema = z.enum(["listening", "reading", "speaking"]);
export const starterImage = z.string().regex(/^\/illustrations\/starters\/[a-z0-9-]+\.webp$/);
export const starterAudio = z.string().regex(/^\/audio\/starters\/l[1-4](?:-[1-5])?\.wav$/);
export const starterPartNames = {
  listening: ["Nối tên với người", "Nghe và viết tên hoặc số", "Chọn hình đúng", "Tô màu theo lời nghe"],
  reading: ["Đánh dấu đúng hoặc sai", "Đọc tranh và viết yes hoặc no", "Xếp chữ thành từ", "Điền từ vào đoạn văn", "Viết một từ theo truyện tranh"],
  speaking: ["Chỉ và đặt thẻ", "Nói về tranh lớn", "Nói về thẻ đồ vật", "Trả lời câu hỏi cá nhân"],
} as const;
export const starterConfig = z.object({
  paper: starterPaperSchema, part: z.number().int().min(1).max(5), mock: z.boolean(),
  scene: starterImage.optional(), passage: z.string().max(1400).optional(), letters: z.string().max(16).optional(),
  cards: z.array(z.object({ value: z.string().max(30), image: starterImage })).max(8).optional(),
  targets: z.array(z.object({ id: z.string().max(12), x: z.number().min(0).max(100), y: z.number().min(0).max(100) })).max(8).optional(),
  guide: z.string().trim().max(1200).optional(), teacher: z.string().trim().max(1200).optional(),
});
export const starterSeconds: Record<StarterPaper, number> = { listening: 1200, reading: 1200, speaking: 300 };
export function starterProjection(config: z.infer<typeof starterConfig>) {
  const { paper, part, mock, scene, passage, letters, cards, targets, guide } = config;
  return { paper, part, mock, scene, passage, letters, cards, targets, guide: mock ? undefined : guide };
}
