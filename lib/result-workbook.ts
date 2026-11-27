import writeXlsxFile, { type Cell } from "write-excel-file/node";
import { z } from "zod";
import { itemSchema, readableResponse } from "./game";
import { assessmentSchema } from "./games/productive";

export type ResultAssignment = { id: string; title: string; content: unknown; assessment: unknown };
export type ResultAttempt = {
  id: string; assignment_id: string; nickname: string; score: number | null; total: number;
  started_at: string; completed_at: string | null; answers: unknown;
  manual_reviews: { state: string; total: number | null } | null;
};

const answerSchema = z.object({ prompt: z.string(), answer: z.array(z.string()), correct: z.boolean().nullable() });
const reviewLabels: Record<string, string> = { pending: "Chờ chấm", reviewed: "Đã chấm", published: "Đã công bố" };
const ratio = (value: number, total: number) => total ? value / total : null;
const percent = (value: number | null) => value === null ? null : { type: Number, value, format: "0.0%" };

export function resultWorkbook(assignments: ResultAssignment[], attempts: ResultAttempt[], from?: string, to?: string) {
  const dateFormat = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "medium" });
  const overview: Cell[][] = [
    ["Kết quả giao bài"],
    ["Ngày bắt đầu (giờ Việt Nam)", from ?? "Tất cả", "Đến ngày", to ?? "Tất cả"],
    ["Bài giao", "Đã bắt đầu", "Đã nộp", "Tỷ lệ nộp", "TB tự động", "TB thủ công"],
  ];
  const results: Cell[][] = [["Bài giao", "ID bài làm", "Biệt danh", "Bắt đầu (VN)", "Hoàn thành (VN)", "Điểm tự động",
    "Tối đa tự động", "Điểm thủ công", "Tối đa thủ công", "Trạng thái chấm"]];
  const details: Cell[][] = [["Bài giao", "ID bài làm", "Biệt danh", "Câu", "Nội dung", "Câu trả lời", "Kết quả"]];
  const byAssignment = new Map<string, ResultAttempt[]>();
  for (const attempt of attempts) {
    const group = byAssignment.get(attempt.assignment_id);
    if (group) group.push(attempt);
    else byAssignment.set(attempt.assignment_id, [attempt]);
  }
  const mistakes: { title: string; question: number; prompt: string; graded: number; wrong: number }[] = [];
  for (const assignment of assignments) {
    const items = z.array(itemSchema).safeParse(assignment.content).data ?? [];
    const assessment = assessmentSchema.safeParse(assignment.assessment).data;
    const manualMax = assessment?.rubric.reduce((sum, criterion) => sum + criterion.max, 0) ?? null;
    const group = byAssignment.get(assignment.id) ?? [];
    const questions = new Map<number, (typeof mistakes)[number]>();
    let completed = 0, autoSum = 0, autoCount = 0, manualSum = 0, manualCount = 0;
    for (const attempt of group) {
      const review = attempt.manual_reviews;
      const done = Boolean(attempt.completed_at);
      const auto = done && attempt.score !== null ? ratio(attempt.score, attempt.total) : null;
      const manualScore = done && review && review.state !== "pending" ? review.total : null;
      const manual = manualScore !== null && manualMax ? ratio(manualScore, manualMax) : null;
      if (done) completed++;
      if (auto !== null) { autoSum += auto; autoCount++; }
      if (manual !== null) { manualSum += manual; manualCount++; }
      results.push([assignment.title, attempt.id, attempt.nickname, dateFormat.format(new Date(attempt.started_at)),
        attempt.completed_at ? dateFormat.format(new Date(attempt.completed_at)) : null,
        done ? attempt.score : null, auto !== null ? attempt.total : null, manualScore, manualMax,
        done ? reviewLabels[review?.state ?? (assessment ? "pending" : "")] ?? "—" : "Chưa nộp"]);
      if (!done || !Array.isArray(attempt.answers)) continue;
      attempt.answers.forEach((value, index) => {
        const entry = answerSchema.safeParse(value).data;
        if (!entry) return;
        const response = items[index] ? readableResponse(items[index], entry.answer) : entry.answer;
        details.push([assignment.title, attempt.id, attempt.nickname, index + 1, entry.prompt, response.join(" / "),
          entry.correct === null ? null : entry.correct ? "Đúng" : "Sai"]);
        if (entry.correct === null) return;
        const question = questions.get(index) ?? { title: assignment.title, question: index + 1, prompt: entry.prompt, graded: 0, wrong: 0 };
        question.graded++;
        if (!entry.correct) question.wrong++;
        questions.set(index, question);
      });
    }
    overview.push([assignment.title, group.length, completed, percent(ratio(completed, group.length)),
      percent(ratio(autoSum, autoCount)), percent(ratio(manualSum, manualCount))]);
    mistakes.push(...Array.from(questions.values()).filter(question => question.wrong));
  }
  overview.push([], ["Bài giao", "Câu", "Nội dung thường sai", "Số lượt sai", "Đã chấm tự động", "Tỷ lệ sai"]);
  for (const item of mistakes.sort((a, b) => b.wrong - a.wrong || b.wrong / b.graded - a.wrong / a.graded)) {
    overview.push([item.title, item.question, item.prompt, item.wrong, item.graded, percent(ratio(item.wrong, item.graded))]);
  }
  // All user-entered values remain literal strings in the OOXML workbook.
  return writeXlsxFile([
    { sheet: "Tổng quan", data: overview, widths: [36, 21, 48, 18, 24, 20] },
    { sheet: "Kết quả", data: results, widths: [36, 40, 24, 26, 26, 17, 18, 17, 18, 22] },
    { sheet: "Chi tiết trả lời", data: details, widths: [36, 40, 24, 9, 50, 50, 17] },
  ].map(({ sheet, data, widths }) => ({
    sheet, columns: widths.map(width => ({ width })),
    data: data.map((row, index) => row.map((cell): Cell => typeof cell === "string"
      ? { type: String, value: cell, fontWeight: index === 0 ? "bold" : undefined } : cell)),
  })));
}
