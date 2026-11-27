import { z } from "zod";

export const classroomLevels = ["Kids", "Starters", "Movers", "Flyers"] as const;
export const classroomSchema = z.object({
  name: z.string().trim().min(1).max(120), level: z.enum(classroomLevels),
  schedule: z.string().trim().max(160), course: z.string().trim().max(120), notes: z.string().trim().max(2000),
});
export const studentSchema = z.object({ name: z.string().trim().min(1).max(80), notes: z.string().trim().max(2000) });
export const joinCodeSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{20}$/);

export type Classroom = z.infer<typeof classroomSchema> & { id: string; archived_at: string | null };
export type Student = z.infer<typeof studentSchema> & { id: string; archived_at: string | null };

export function rosterNames(rows: readonly unknown[][]) {
  const [header, ...data] = rows;
  const names = header?.map(value => String(value ?? "").trim().toLowerCase()) ?? [];
  const column = names.findIndex(value => ["name", "tên", "họ tên", "tên học sinh"].includes(value));
  if (column < 0) throw Error("Dòng đầu cần có cột name hoặc Họ tên.");
  const nonEmpty = data.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ""));
  if (!nonEmpty.length || nonEmpty.length > 200) throw Error("Nhập từ 1 đến 200 học sinh mỗi lần.");
  return nonEmpty.map((row, i) => {
    const parsed = studentSchema.shape.name.safeParse(row[column]);
    if (!parsed.success) throw Error(`Kiểm tra tên học sinh ở dòng ${i + 2}.`);
    return parsed.data;
  });
}
