import { z } from "zod";
import { itemSchema, normalize, skills, type Item } from "./game";
import { cambridgeLevels, starterPapers } from "./games/starters";
import { assessmentSchema, isSpeaking, isWriting } from "./games/productive";
import { isAudioPractice, isPhonics, isReading } from "./games/practice";

export const progressFilters = z.object({
  classroom: z.uuid().optional(), student: z.uuid().optional(), assignment: z.uuid().optional(),
  skill: z.enum(skills).optional(), from: z.iso.date().optional(), to: z.iso.date().optional(),
}).refine(value => !value.from || !value.to || value.from <= value.to);
export type ProgressFilters = z.infer<typeof progressFilters>;
export const readProgressFilters = (query: Record<string, unknown>) =>
  progressFilters.safeParse(Object.fromEntries(Object.entries(query).filter(([, value]) => value !== "")));

export type ProgressAssignment = {
  id: string; classroom_id: string; title: string; content: unknown; assessment: unknown;
  created_at: string; deadline: string | null; closed: boolean; attempt_cap: number;
  classrooms?: { name: string } | null;
};
export type ProgressAttempt = {
  id: string; assignment_id: string; student_id: string; started_at: string; completed_at: string | null;
  score: number | null; total: number | null; answers: unknown;
  manual_reviews: { state: string; total: number | null } | null;
};
export type ProgressRecipient = { assignment_id: string; student_id: string };
const answerSchema = z.object({ prompt: z.string(), answer: z.array(z.string()), correct: z.boolean().nullable() });
const statuses = { new: "Chưa làm", working: "Đang làm", submitted: "Đã nộp", pending: "Chờ chấm", graded: "Đã chấm" };
export const scoreLabels = { pending: "Chờ chấm", reviewed: "Đã chấm", published: "Đã công bố" } as const;
export const progressDate = (value: string) => new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short",
}).format(new Date(value));

export function itemSkill(item: Item) {
  const paper = item.practice?.starters?.paper;
  if (paper === "listening") return ["Listening"];
  if (paper === "speaking") return ["Speaking"];
  if (paper === "reading") return [item.practice?.starters?.open ? "Writing" : "Reading"];
  if (item.english?.skill) return [item.english.skill];
  const mode = item.practice?.mode;
  if (!mode) return [];
  if (isPhonics(mode)) return ["Phonics"];
  if (isAudioPractice(mode)) return ["Listening"];
  if (isReading(mode)) return ["Reading"];
  if (isSpeaking(mode)) return ["Speaking"];
  if (isWriting(mode)) return ["Writing"];
  return mode === "grammar" ? ["Grammar"] : [];
}

export function summarizeProgress(assignments: ProgressAssignment[], recipients: ProgressRecipient[], attempts: ProgressAttempt[], filterSkill?: string) {
  const sources = assignments.map(assignment => ({ ...assignment,
    items: z.array(itemSchema).safeParse(assignment.content).data ?? [],
    rubric: assessmentSchema.safeParse(assignment.assessment).data?.rubric,
  })).filter(row => !filterSkill || row.items.some(item => itemSkill(item).includes(filterSkill)));
  const byId = new Map(sources.map(row => [row.id, row]));
  const history = new Map<string, ProgressAttempt[]>();
  for (const attempt of attempts) {
    const key = attempt.assignment_id + "/" + attempt.student_id;
    const group = history.get(key);
    if (group) group.push(attempt);
    else history.set(key, [attempt]);
  }
  const skills = new Map<string, { label: string; correct: number; total: number }>();
  const parts = new Map<string, { label: string; correct: number; total: number; open: number }>();
  const vocabulary = new Map<string, { label: string; seen: number; correct: number; marked: number }>();
  const mistakes = new Map<string, { prompt: string; title: string; wrong: number; total: number }>();
  const table = recipients.flatMap(recipient => {
    const assignment = byId.get(recipient.assignment_id);
    if (!assignment) return [];
    const tries = (history.get(recipient.assignment_id + "/" + recipient.student_id) ?? [])
      .sort((a, b) => b.started_at.localeCompare(a.started_at) || b.id.localeCompare(a.id));
    const last = tries[0];
    const latestSubmission = tries.find(row => row.completed_at);
    const review = latestSubmission?.manual_reviews;
    const status = !last ? statuses.new : !last.completed_at ? statuses.working
      : assignment.rubric && (!review || review.state === "pending") ? statuses.pending
        : last.score !== null || review?.total != null ? statuses.graded : statuses.submitted;
    for (const attempt of tries) {
      if (!Array.isArray(attempt.answers) || !attempt.completed_at) continue;
      attempt.answers.forEach((raw, index) => {
        const answer = answerSchema.safeParse(raw).data;
        const item = assignment.items[index];
        if (!answer || !item || (filterSkill && !itemSkill(item).includes(filterSkill))) return;
        const cambridge = item.practice?.starters;
        if (cambridge) {
          const label = `${cambridgeLevels[cambridge.level ?? "starters"]} · ${starterPapers[cambridge.paper]} · Part ${cambridge.part}`;
          const current = parts.get(label) ?? { label, correct: 0, total: 0, open: 0 };
          if (answer.correct === null) current.open++;
          else { current.total++; current.correct += Number(answer.correct); }
          parts.set(label, current);
        }
        if (item.english?.skill === "Vocabulary") {
          const word = normalize(item.prompt);
          const current = vocabulary.get(word) ?? { label: item.prompt, seen: 0, correct: 0, marked: 0 };
          current.seen++;
          if (answer.correct !== null) { current.marked++; current.correct += Number(answer.correct); }
          vocabulary.set(word, current);
        }
        if (answer.correct === null) return;
        for (const label of itemSkill(item)) {
          const current = skills.get(label) ?? { label, correct: 0, total: 0 };
          current.total++;
          current.correct += Number(answer.correct);
          skills.set(label, current);
        }
        const key = assignment.id + "/" + index;
        const error = mistakes.get(key) ?? { prompt: answer.prompt, title: assignment.title, wrong: 0, total: 0 };
        error.total++;
        error.wrong += Number(!answer.correct);
        mistakes.set(key, error);
      });
    }
    const manualMax = assignment.rubric?.reduce((sum, criterion) => sum + criterion.max, 0) ?? null;
    return [{ recipient, assignment, tries, status, latestSubmission, manualMax }];
  });
  const mistakesSorted = Array.from(mistakes.values()).filter(row => row.wrong > 0).sort((a, b) => b.wrong - a.wrong || b.wrong / b.total - a.wrong / a.total);
  const progress = table.flatMap(({ assignment, tries, manualMax }) => tries.filter(attempt => attempt.completed_at)
    .map(attempt => ({ assignment: assignment.title, attempt, manualMax })))
    .sort((a, b) => a.attempt.completed_at!.localeCompare(b.attempt.completed_at!));
  const latest = table.map(row => row.latestSubmission).filter(attempt => attempt !== undefined);
  const automatic = latest.flatMap(attempt => attempt.score !== null && attempt.total ? [attempt.score / attempt.total] : []);
  const manual = table.flatMap(({ latestSubmission, manualMax }) => {
    const result = latestSubmission?.manual_reviews;
    return result?.state !== "pending" && result?.total != null && manualMax ? [result.total / manualMax] : [];
  });
  const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const manualSkills = ["Speaking", "Writing"].filter(label => !filterSkill || filterSkill === label).flatMap(label => {
    const values = table.flatMap(({ latestSubmission, assignment, manualMax }) => {
      const review = latestSubmission?.manual_reviews;
      if (assessmentSchema.safeParse(assignment.assessment).data?.skill !== label ||
        review?.state === "pending" || review?.total == null || !manualMax) return [];
      return [review.total / manualMax];
    });
    return values.length ? [{ label, count: values.length, average: mean(values)! }] : [];
  });
  return {
    table, sources, progress, skills: Array.from(skills.values()), parts: Array.from(parts.values()),
    vocabulary: Array.from(vocabulary.values()), mistakes: mistakesSorted, manualSkills,
    completed: latest.length, pending: attempts.filter(attempt => byId.has(attempt.assignment_id) && attempt.manual_reviews?.state === "pending").length,
    averageAuto: mean(automatic), averageManual: mean(manual),
  };
}
