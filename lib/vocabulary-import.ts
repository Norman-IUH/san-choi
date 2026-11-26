import { itemSchema, type Item } from "./game";

export function vocabularyItems(rows: readonly unknown[][]): Item[] {
  const [header, ...data] = rows;
  const names = header?.map(value => typeof value === "string" ? value.toLowerCase().trim() : "");
  if (!names?.includes("word") || !names.includes("meaning") || new Set(names.filter(Boolean)).size !== names.filter(Boolean).length) {
    throw new Error("Cần có hai cột word và meaning, tên cột không được trùng.");
  }
  const value = (row: unknown[], column: string) => {
    const cell = row[names.indexOf(column)];
    return typeof cell === "string" ? cell.trim() : "";
  };
  const nonEmpty = data.filter(row => row.some(cell => cell != null && cell !== ""));
  if (nonEmpty.length < 1 || nonEmpty.length > 60) throw new Error("Nhập từ 1 đến 60 dòng từ vựng.");
  return nonEmpty.map((row, i) => {
    const meaning = value(row, "meaning");
    const parsed = itemSchema.safeParse({
      version: 2, prompt: value(row, "word"), answers: [meaning], options: [],
      english: {
        meaning, level: value(row, "level") || undefined, skill: "Vocabulary",
        ipa: value(row, "ipa") || undefined, example: value(row, "example") || undefined,
      },
    });
    if (!parsed.success) throw new Error(`Dòng dữ liệu ${i + 1} có từ, nghĩa hoặc cấp độ không hợp lệ.`);
    return parsed.data;
  });
}

export async function importVocabulary(file: File) {
  if (!file.size || file.size > 512 * 1024) throw new Error("Tệp từ vựng phải dưới 512 KiB.");
  if (/\.csv$/i.test(file.name)) {
    const { parse } = await import("csv-parse/browser/esm/sync");
    return vocabularyItems(parse(await file.text(), { bom: true, skip_empty_lines: true, max_record_size: 3000 }));
  }
  if (/\.xlsx$/i.test(file.name)) {
    const { readSheet } = await import("read-excel-file/browser");
    return vocabularyItems(await readSheet(file, 1));
  }
  throw new Error("Chọn tệp CSV hoặc XLSX.");
}
