import { expect, test } from "vitest";
import { joinCodeSchema, rosterNames } from "../lib/classroom";
import { newStudentCode, studentCodeHash } from "../lib/student-code";

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
