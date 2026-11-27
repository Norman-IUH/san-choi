import { expect, test } from "vitest";
import readXlsxFile from "read-excel-file/node";
import { resultWorkbook, type ResultAttempt } from "../lib/result-workbook";

test("reopens the three Excel sheets with numeric grades, blank pending scores and literal formula-like input", async () => {
  const started_at = "2026-11-27T02:00:00Z";
  const base = { nickname: "=1+1", started_at, completed_at: started_at, total: 4, score: 0, answers: [], manual_reviews: null };
  const attempts: ResultAttempt[] = [
    { ...base, assignment_id: "quiz", id: "1", answers: [{ prompt: "@word", answer: ["+1"], correct: false }] },
    { ...base, assignment_id: "quiz", id: "2", score: 4, answers: [{ prompt: "@word", answer: ["-word"], correct: true }] },
    { ...base, assignment_id: "quiz", id: "3", completed_at: null },
    { ...base, assignment_id: "speaking", id: "4", score: null, manual_reviews: { state: "pending", total: null } },
    { ...base, assignment_id: "speaking", id: "5", score: null, manual_reviews: { state: "published", total: 0 } },
  ];
  const bytes = await resultWorkbook([
    { id: "quiz", title: "=SUM(1,2)", content: [], assessment: null },
    { id: "speaking", title: "Speaking", content: [], assessment: null },
  ], attempts, "2026-11-27", "2026-11-27").toBuffer();
  const sheets = await readXlsxFile(bytes);
  expect(sheets.map(sheet => sheet.sheet)).toEqual(["Tổng quan", "Kết quả", "Chi tiết trả lời"]);
  const [overview, results, details] = sheets.map(sheet => sheet.data);
  expect(overview[3]).toEqual(["=SUM(1,2)", 3, 2, 2 / 3, 0.5, null]);
  expect(overview.at(-1)).toEqual(["=SUM(1,2)", 1, "@word", 1, 2, 0.5]);
  expect(results[1][2]).toBe("=1+1");
  expect(results[1][5]).toBe(0);
  expect(results[3].slice(5)).toEqual([null, null, null, null, "Chưa nộp"]);
  expect(results[4].slice(5)).toEqual([null, null, null, null, "Chờ chấm"]);
  expect(results[5].slice(5)).toEqual([null, null, 0, null, "Đã công bố"]);
  expect(details[1].slice(4)).toEqual(["@word", "+1", "Sai"]);
});
