"use server";
import { cambridgeResponseLimit } from "@/lib/games/starters";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { contentSchema, grade, makePlayItems, missedReview, templateSchema } from "@/lib/game";
import { allowedTeacher, database, privilegedDatabase, serverConfigured } from "@/lib/supabase";
import { mediaUrls } from "@/lib/media-server";
import { hangmanPattern } from "@/lib/games/word-puzzles";
import type { Item } from "@/lib/game";
import { isProductive } from "@/lib/games/productive";
import { attemptLimit } from "@/lib/attempt-rate";
import { joinCodeSchema } from "@/lib/classroom";
import { studentCodeHash } from "@/lib/student-code";

const studentMedia = (items: Item[]) => items.map(item =>
  item.practice ? { ...item, english: undefined, optionMedia: item.practice.pictureChoices
    ? item.optionMedia?.map(({ option, image }) => ({ option, image })) : item.optionMedia } : item);

export async function guessAssignmentLetter(id: string, index: number, letter: string | null, expectedDraftId?: string) {
  if (!serverConfigured || !z.uuid().safeParse(id).success ||
    !z.number().int().min(0).max(59).safeParse(index).success ||
    !z.string().length(1).regex(/^[A-Z]$/).nullable().safeParse(letter).success) return null;
  const token = (await cookies()).get(`attempt-${id}`)?.value;
  if (!token || !z.uuid().safeParse(token).success) return null;
  const assignment = await getAssignment(id);
  if (!assignment || assignment.template !== "hangman" || !assignment.items[index]) return null;
  if (assignment.data.classroom_id && (expectedDraftId !== draftIdFor(token) || !await validateClassroomAttempt(assignment, token))) return null;
  if (await attemptLimit(assignment.db, id, "finish", "hangman:" + token)) return null;
  const { data } = await assignment.db.rpc("hangman_guess", { p_assignment: id, p_attempt: token, p_index: index, p_letter: letter });
  if (typeof data !== "string") return null;
  const guesses = Array.from(data);
  return { ...hangmanPattern(assignment.items[index].answers[0], guesses), guesses };
}

async function getAssignment(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const db = privilegedDatabase();
  const { data, error } = await db.from("assignments").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Không tải được bài tập");
  if (!data || !allowedTeacher(data.owner_id) || data.closed || (data.deadline && Date.parse(data.deadline) <= Date.now())) return null;
  const template = templateSchema.safeParse(data.template);
  if (!template.success) return null;
  const content = contentSchema(template.data).safeParse(data.content);
  if (!content.success) return null;
  return { db, data, template: template.data, items: content.data };
}

export async function refreshLessonMedia(source: "assignment" | "activity" | "resource" | "embed", id: string) {
  if (!serverConfigured || !z.uuid().safeParse(id).success) return null;
  if (source === "assignment") {
    const token = (await cookies()).get(`attempt-${id}`)?.value;
    if (!z.uuid().safeParse(token).success) return null;
    const assignment = await getAssignment(id);
    if (!assignment) return null;
    const { db, data, items } = assignment;
    if (data.classroom_id && !await validateClassroomAttempt(assignment, token!)) return null;
    const attempt = await db.from("attempts").select("id").eq("assignment_id", id).eq("id", token!).is("completed_at", null).maybeSingle();
    if (!attempt.data || await attemptLimit(db, id, "media", "assignment:" + token)) return null;
    const fresh = await mediaUrls(studentMedia(items), data.owner_id, 900);
    const stillOpen = await getAssignment(id);
    const stillInProgress = await db.from("attempts").select("id").eq("assignment_id", id)
      .eq("id", token!).is("completed_at", null).maybeSingle();
    return stillOpen && stillInProgress.data && (!data.classroom_id || await validateClassroomAttempt(assignment, token!)) ? fresh : null;
  }
  if (source !== "activity" && source !== "resource" && source !== "embed") return null;
  const db = source === "activity" ? await database() : privilegedDatabase();
  let query = db.from("activities").select("template,content,owner_id").eq("id", id).is("deleted_at", null);
  if (source === "resource") query = query.in("visibility", ["public", "unlisted"]).eq("draft", false);
  if (source === "embed") query = query.eq("visibility","public").eq("draft",false);
  const { data } = await query.maybeSingle();
  if (!data || !allowedTeacher(data.owner_id)) return null;
  if (source === "activity") {
    const { data: { user } } = await db.auth.getUser();
    if (user?.id !== data.owner_id) return null;
  }
  const template = templateSchema.safeParse(data.template);
  const items = template.success && contentSchema(template.data, true).safeParse(data.content);
  if (source !== "activity" && items && items.success && items.data.some(item => item.practice)) return null;
  if (!items || !items.success || await attemptLimit(privilegedDatabase(), id, "media")) return null;
  return mediaUrls(items.data, data.owner_id, 900);
}

const draftIdFor = (token: string) => createHash("sha256").update(token).digest("hex");
const resumeError = "Không tìm thấy phiên của bản nháp trong thẻ này. Câu trả lời vẫn được giữ trong trình duyệt.";
type ActiveAssignment = NonNullable<Awaited<ReturnType<typeof getAssignment>>>;
async function validateClassroomAttempt(assignment: ActiveAssignment, token: string) {
  const { data, error } = await assignment.db.rpc("valid_classroom_attempt", { p_assignment: assignment.data.id, p_token: token });
  return !error && data === true;
}

async function submittedResult(id: string, token: string, assignment: ActiveAssignment,
  record: { score: number | null; total: number | null; answers: unknown }) {
  const { data, items } = assignment;
  if (data.assessment && !data.classroom_id) {
    (await cookies()).set(`receipt-${id}`, token, { httpOnly: true, sameSite: "lax", secure: process.env.APP_URL?.startsWith("https:"),
      path: `/play/${id}/review`, maxAge: 30 * 86400 });
  }
  const answers = record.answers as { answer: string[]; correct: boolean | null }[];
  return { score: data.show_score ? record.score : null, total: record.total ?? 0,
    pendingReview: Boolean(data.assessment), ...(data.show_review && { review: missedReview(items, answers) }) };
}

export async function startAttempt(id: string, nickname: string, resumeDraftId?: string, studentCode?: string) {
  const assignment = await getAssignment(id);
  if (!assignment) return { error: "Bài tập đã đóng hoặc hết hạn." } as const;
  const { db, data, template, items } = assignment;
  if (resumeDraftId !== undefined && !items[0]?.practice?.starters?.mock) return { error: resumeError } as const;
  const limitError = await attemptLimit(db, id, data.classroom_id ? "student-code" : "start");
  if (limitError) return { error: limitError } as const;
  const name = z.string().trim().min(1).max(80).safeParse(data.require_name ? nickname : "Ẩn danh");
  if (!name.success) return { error: "Nhập biệt danh từ 1 đến 80 ký tự." } as const;
  const jar = await cookies();
  const cookie = `attempt-${id}`;
  let token = jar.get(cookie)?.value;
  if (!z.uuid().safeParse(token).success) token = undefined;
  if (data.classroom_id) {
    const code = joinCodeSchema.safeParse(studentCode);
    const denied = { error: "Mã cá nhân không hợp lệ cho bài này. Hãy liên hệ giáo viên." } as const;
    if (!code.success) return denied;
    const resume = !!token && resumeDraftId !== undefined && draftIdFor(token) === resumeDraftId;
    const { data: opened, error } = await db.rpc("open_classroom_attempt", { p_assignment: id, p_code_hash: studentCodeHash(code.data),
      p_token: token ?? null, p_resume: resume }).maybeSingle()
      .overrideTypes<{ attempt_id: string | null; issue: string | null; already_completed: boolean }, { merge: false }>();
    if (error) return { error: "Chưa bắt đầu được bài làm. Hãy thử lại." } as const;
    if (opened?.issue === "tries") return { error: "Em đã dùng hết số lượt làm bài." } as const;
    if (opened?.issue === "closed") return { error: "Bài tập đã đóng hoặc hết hạn." } as const;
    if (!opened?.attempt_id) return denied;
    token = opened.attempt_id;
    if (opened.already_completed) {
      const { data: previous } = await db.from("attempts").select("score,total,answers").eq("assignment_id", id).eq("id", token).maybeSingle();
      if (!previous || !await validateClassroomAttempt(assignment, token)) return denied;
      return { items: makePlayItems(template, items), submission: await submittedResult(id, token, assignment, previous) };
    }
  } else if (resumeDraftId !== undefined && (!token || draftIdFor(token) !== resumeDraftId)) return { error: resumeError } as const;
  else if (token) {
    const { data: previous, error } = await db.from("attempts").select("completed_at,score,total,answers")
      .eq("assignment_id", id).eq("id", token).maybeSingle();
    if (error) return { error: "Chưa đọc được phiên làm bài. Hãy thử lại." } as const;
    if (resumeDraftId !== undefined) {
      if (!previous) return { error: resumeError } as const;
      if (previous.completed_at) return { items: makePlayItems(template, items), submission: await submittedResult(id, token, assignment, previous) };
    }
    if (!previous || previous.completed_at) token = undefined;
  }
  if (!token) {
    token = crypto.randomUUID();
    const { error } = await db.from("attempts").insert({ id: token, assignment_id: id, nickname: name.data });
    if (error) return { error: "Chưa bắt đầu được bài làm. Hãy thử lại." } as const;
  }
  jar.set(cookie, token, { httpOnly: true, sameSite: "lax", secure: process.env.VERCEL === "1" || process.env.APP_URL?.startsWith("https:"), path: "/", maxAge: 86400 });
  const projected = makePlayItems(template, items);
  if (template === "hangman") {
    const history = await db.rpc("hangman_history", { p_attempt: token });
    if (history.error) return { error: "Chưa tải được lượt đoán. Hãy thử lại." } as const;
    for (const row of history.data as { item_index: number; guesses: string }[]) {
      const item = items[row.item_index];
      if (!item) continue;
      const guesses = Array.from(row.guesses);
      projected[row.item_index].hangman = { ...hangmanPattern(item.answers[0], guesses), guesses };
    }
  }
  return { draftId: draftIdFor(token),
    items: projected, assets: await mediaUrls(studentMedia(items), data.owner_id),
    reveals: template === "flash-cards" ? items.map(item => item.answers[0]) :
      template === "open-box" ? items.map(item => item.prompt) : [] };
}

export async function finishAttempt(id: string, values: string[][], expectedDraftId?: string) {
  if (!z.uuid().safeParse(id).success) return { error: "Bài tập không hợp lệ." } as const;
  const parsed = z.array(z.array(z.string().max(1200)).max(40)).min(1).max(60).safeParse(values);
  if (!parsed.success) return { error: "Bài làm không hợp lệ." } as const;
  const token = (await cookies()).get(`attempt-${id}`)?.value;
  if (!token || !z.uuid().safeParse(token).success) return { error: "Phiên đã hết hạn. Hãy tải lại bài tập." } as const;
  if (expectedDraftId !== undefined && draftIdFor(token) !== expectedDraftId) return { error: resumeError } as const;
  const assignment = await getAssignment(id);
  if (!assignment) return { error: "Bài tập đã đóng hoặc hết hạn." } as const;
  const { db, data, template, items } = assignment;
  if (data.classroom_id && (expectedDraftId !== draftIdFor(token) || !await validateClassroomAttempt(assignment, token))) {
    return { error: "Phiên làm bài không còn hiệu lực. Hãy kiểm tra mã với giáo viên." } as const;
  }
  const limitError = await attemptLimit(db, id, "finish");
  if (limitError) return { error: limitError } as const;
  if (parsed.data.length !== items.length) return { error: "Hãy hoàn thành tất cả các mục trước khi nộp." } as const;
  if (parsed.data.some((row, index) => {
    const practice = items[index].practice;
    const cambridge = practice?.starters;
    if (cambridge) return cambridge.paper === "speaking" ? row.length > 0
      : row.length > 1 || row.some(value => value.length > cambridgeResponseLimit(cambridge));
    if (practice?.production && isProductive(practice.mode)) return row.length > 1 || row.some(value => value.length > practice.production!.limit);
    return row.some(value => value.length > 400);
  })) return { error: "Câu trả lời vượt giới hạn." } as const;
  let answers = parsed.data;
  if (template === "hangman") {
    const previous = await db.from("attempts").select("completed_at").eq("assignment_id", id).eq("id", token).maybeSingle();
    if (!previous.data) return { error: "Phiên đã hết hạn. Hãy tải lại bài tập." } as const;
    if (!previous.data.completed_at) {
      const history = await db.rpc("hangman_history", { p_attempt: token });
      if (history.error) return { error: "Chưa kiểm tra được lượt đoán. Hãy thử lại." } as const;
      const guesses = new Map<number, string>((history.data as { item_index: number; guesses: string }[])
        .map(row => [row.item_index, row.guesses]));
      const rounds = items.map((item, index) => hangmanPattern(item.answers[0], Array.from(guesses.get(index) ?? "")));
      if (rounds.some(round => round.misses < 6 && !round.pattern.every(Boolean))) {
        return { error: "Hãy hoàn thành các lượt đoán trước khi nộp." } as const;
      }
      answers = rounds.map(round => round.pattern.every(Boolean) ? [round.pattern.join("")] : []);
    }
  }
  const result = grade(template, items, answers);
  const { data: saved, error } = await db.rpc("finish_attempt", {
    p_assignment: id, p_attempt: token, p_answers: answers.map((answer, index) => ({
      prompt: items[index].prompt, answer, correct: result.correct[index],
    })), p_score: result.score, p_total: result.total,
  }).maybeSingle();
  if (error || !saved) {
    console.warn(JSON.stringify({ operation: "finish_attempt", code: error?.code ?? "no_attempt" }));
    return { error: "Chưa nộp được bài. Kiểm tra hạn và thử lại." } as const;
  }
  return submittedResult(id, token, assignment, saved as { score: number | null; total: number | null; answers: unknown });
}
