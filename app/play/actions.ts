"use server";
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

const studentMedia = (items: Item[]) => items.map(item =>
  item.practice ? { ...item, english: undefined, optionMedia: item.practice.pictureChoices
    ? item.optionMedia?.map(({ option, image }) => ({ option, image })) : item.optionMedia } : item);

export async function guessAssignmentLetter(id: string, index: number, letter: string | null) {
  if (!serverConfigured || !z.uuid().safeParse(id).success ||
    !z.number().int().min(0).max(59).safeParse(index).success ||
    !z.string().length(1).regex(/^[A-Z]$/).nullable().safeParse(letter).success) return null;
  const token = (await cookies()).get(`attempt-${id}`)?.value;
  if (!token || !z.uuid().safeParse(token).success) return null;
  const assignment = await getAssignment(id);
  if (!assignment || assignment.template !== "hangman" || !assignment.items[index]) return null;
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

export async function refreshLessonMedia(source: "assignment" | "activity" | "resource", id: string) {
  if (!serverConfigured || !z.uuid().safeParse(id).success) return null;
  if (source === "assignment") {
    const token = (await cookies()).get(`attempt-${id}`)?.value;
    if (!z.uuid().safeParse(token).success) return null;
    const assignment = await getAssignment(id);
    if (!assignment) return null;
    const { db, data, items } = assignment;
    const attempt = await db.from("attempts").select("id").eq("assignment_id", id).eq("id", token!).is("completed_at", null).maybeSingle();
    if (!attempt.data || await attemptLimit(db, id, "media", "assignment:" + token)) return null;
    const fresh = await mediaUrls(studentMedia(items), data.owner_id, 900);
    const stillOpen = await getAssignment(id);
    const stillInProgress = await db.from("attempts").select("id").eq("assignment_id", id)
      .eq("id", token!).is("completed_at", null).maybeSingle();
    return stillOpen && stillInProgress.data ? fresh : null;
  }
  if (source !== "activity" && source !== "resource") return null;
  const db = source === "activity" ? await database() : privilegedDatabase();
  let query = db.from("activities").select("template,content,owner_id").eq("id", id).is("deleted_at", null);
  if (source === "resource") query = query.in("visibility", ["public", "unlisted"]).eq("draft", false);
  const { data } = await query.maybeSingle();
  if (!data || !allowedTeacher(data.owner_id)) return null;
  if (source === "activity") {
    const { data: { user } } = await db.auth.getUser();
    if (user?.id !== data.owner_id) return null;
  }
  const template = templateSchema.safeParse(data.template);
  const items = template.success && contentSchema(template.data, true).safeParse(data.content);
  if (source === "resource" && items && items.success && items.data.some(item => item.practice)) return null;
  if (!items || !items.success || await attemptLimit(privilegedDatabase(), id, "media")) return null;
  return mediaUrls(items.data, data.owner_id, 900);
}

export async function startAttempt(id: string, nickname: string) {
  const assignment = await getAssignment(id);
  if (!assignment) return { error: "Bài tập đã đóng hoặc hết hạn." } as const;
  const { db, data, template, items } = assignment;
  const limitError = await attemptLimit(db, id, "start");
  if (limitError) return { error: limitError } as const;
  const name = z.string().trim().min(1).max(80).safeParse(data.require_name ? nickname : "Ẩn danh");
  if (!name.success) return { error: "Nhập biệt danh từ 1 đến 80 ký tự." } as const;
  const jar = await cookies();
  const cookie = `attempt-${id}`;
  let token = jar.get(cookie)?.value;
  if (token) {
    const { data: previous } = await db.from("attempts").select("completed_at")
      .eq("assignment_id", id).eq("id", token).maybeSingle();
    if (!previous || previous.completed_at) token = undefined;
  }
  if (!token) {
    token = crypto.randomUUID();
    const { error } = await db.from("attempts").insert({ id: token, assignment_id: id, nickname: name.data });
    if (error) return { error: "Chưa bắt đầu được bài làm. Hãy thử lại." } as const;
    jar.set(cookie, token, { httpOnly: true, sameSite: "lax", secure: process.env.APP_URL?.startsWith("https:"), path: "/", maxAge: 86400 });
  }
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
  return { draftId: createHash("sha256").update(token).digest("hex"),
    items: projected, assets: await mediaUrls(studentMedia(items), data.owner_id),
    reveals: template === "flash-cards" ? items.map(item => item.answers[0]) :
      template === "open-box" ? items.map(item => item.prompt) : [] };
}

export async function finishAttempt(id: string, values: string[][]) {
  if (!z.uuid().safeParse(id).success) return { error: "Bài tập không hợp lệ." } as const;
  const parsed = z.array(z.array(z.string().max(1200)).max(40)).min(1).max(60).safeParse(values);
  if (!parsed.success) return { error: "Bài làm không hợp lệ." } as const;
  const token = (await cookies()).get(`attempt-${id}`)?.value;
  if (!token || !z.uuid().safeParse(token).success) return { error: "Phiên đã hết hạn. Hãy tải lại bài tập." } as const;
  const assignment = await getAssignment(id);
  if (!assignment) return { error: "Bài tập đã đóng hoặc hết hạn." } as const;
  const { db, data, template, items } = assignment;
  const limitError = await attemptLimit(db, id, "finish");
  if (limitError) return { error: limitError } as const;
  if (parsed.data.length !== items.length) return { error: "Hãy hoàn thành tất cả các mục trước khi nộp." } as const;
  if (parsed.data.some((row, index) => {
    const practice = items[index].practice;
    if (practice?.starters) return practice.starters.paper === "speaking" ? row.length > 0 : row.length > 1 || row.some(value => value.length > 40);
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
  if (error || !saved) return { error: "Chưa nộp được bài. Kiểm tra hạn và thử lại." } as const;
  const record = saved as { score: number | null; total: number; answers: { answer: string[]; correct: boolean | null }[] };
  if (data.assessment) {
    (await cookies()).set(`receipt-${id}`, token, { httpOnly: true, sameSite: "lax", secure: process.env.APP_URL?.startsWith("https:"),
      path: `/play/${id}/review`, maxAge: 30 * 86400 });
  }
  return { score: data.show_score ? record.score : null, total: record.total,
    pendingReview: Boolean(data.assessment),
    ...(data.show_review && { review: missedReview(items, record.answers) }) };
}
