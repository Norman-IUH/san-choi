import { expect, test } from "vitest";
import { joinCodeSchema, rosterNames } from "../lib/classroom";
import { newStudentCode, studentCodeHash } from "../lib/student-code";
import { summarizeProgress, type ProgressAssignment, type ProgressAttempt } from "../lib/classroom-progress";
import { flyerPaper } from "../lib/flyers-paper";

test("retains duplicate names without importing unnecessary attributes", () => {
  expect(rosterNames([["Họ tên", "Email"], [" Minh ", "ignored"], ["Minh", "ignored"]])).toEqual(["Minh", "Minh"]);
  expect(() => rosterNames([["Email"], ["ignored"]])).toThrow(/cột/);
  expect(() => rosterNames([["name", "notes"], ["", "missing name"]])).toThrow(/dòng 2/);
});

test("student codes are random and stored as fixed-size hashes", () => {
  const code = newStudentCode();
  expect(joinCodeSchema.safeParse(code).success).toBe(true);
  expect(newStudentCode()).not.toBe(code);
  expect(studentCodeHash(code)).toMatch(/^[0-9a-f]{64}$/);
});

test("progress distinguishes zero, pending, working and untouched and keeps every submission", () => {
  const saved = "2026-11-27T12:00:00Z";
  const quiz: ProgressAssignment = { id: "quiz", classroom_id: "class", title: "Words", closed: false, deadline: null, created_at: saved,
    attempt_cap: 2, assessment: null, content: [{ prompt: "apple", answers: ["a fruit"], options: [], english: { skill: "Vocabulary" } }] };
  const oral: ProgressAssignment = { ...quiz, id: "oral", title: "Flyers", content: flyerPaper("speaking", 2)!.items,
    assessment: { version: 1, skill: "Speaking", level: "A2 Flyers", rubric: [{ title: "Vocabulary", max: 4, description: "" }] } };
  const wrong: ProgressAttempt = { id: "0", assignment_id: "quiz", student_id: "s1", started_at: saved, completed_at: saved,
    score: 0, total: 1, answers: [{ prompt: "apple", answer: ["vehicle"], correct: false }], manual_reviews: null };
  const data = summarizeProgress([quiz, oral], [
    { assignment_id: "quiz", student_id: "s1" }, { assignment_id: "quiz", student_id: "s2" },
    { assignment_id: "quiz", student_id: "s3" }, { assignment_id: "oral", student_id: "s1" },
  ], [wrong, { ...wrong, id: "1", student_id: "s2", completed_at: null, score: null, total: null, answers: null },
    { ...wrong, id: "2", assignment_id: "oral", score: null, total: 0, answers: [{ prompt: "Speak", answer: [], correct: null }],
      manual_reviews: { state: "pending", total: null } }]);
  expect(data.table.map(row => row.status)).toEqual(["Đã chấm", "Đang làm", "Chưa làm", "Chờ chấm"]);
  expect(data.averageAuto).toBe(0);
  expect(data.averageManual).toBeNull();
  expect(data.completed).toBe(2);
  expect(data.pending).toBe(1);
  expect(data.vocabulary).toEqual([{ label: "apple", seen: 1, correct: 0, marked: 1 }]);
  expect(data.parts[0]).toMatchObject({ label: "A2 Flyers · Speaking · Part 2", total: 0, open: 1 });
});
