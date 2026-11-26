"use server";
import { createHash, createHmac } from "node:crypto";
import { isIP } from "node:net";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { contentSchema, grade, makePlayItems, missedReview, templateSchema } from "@/lib/game";
import { allowedTeacher, privilegedDatabase } from "@/lib/supabase";
import { mediaUrls } from "@/lib/media-server";

async function attemptLimit(db: ReturnType<typeof privilegedDatabase>, id: string, operation: "start" | "finish") {
  const ip = process.env.VERCEL === "1" ? (await headers()).get("x-vercel-forwarded-for")?.trim() ?? "" : "";
  // shortcut: non-Vercel hosts share a bucket per assignment until they supply a trusted client address.
  const identity = isIP(ip) ? `ip:${ip}` : `assignment:${id.toLowerCase()}`;
  const scope = createHmac("sha256", process.env.SUPABASE_SECRET_KEY!).update(identity).digest("hex");
  const { data, error } = await db.rpc("consume_attempt_limit", { p_operation: operation, p_scope: scope });
  if (error) {
    console.error(JSON.stringify({ operation: "attempt_rate_limit", code: error.code }));
    return "Máy chủ đang gián đoạn. Hãy thử lại sau.";
  }
  return data === true ? null : "Có quá nhiều yêu cầu. Hãy thử lại sau một phút.";
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
  return { draftId: createHash("sha256").update(token).digest("hex"),
    items: makePlayItems(template, items), assets: await mediaUrls(items, data.owner_id),
    reveals: template === "flash-cards" ? items.map(item => item.answers[0]) :
      template === "open-box" ? items.map(item => item.prompt) : [] };
}

export async function finishAttempt(id: string, values: string[][]) {
  if (!z.uuid().safeParse(id).success) return { error: "Bài tập không hợp lệ." } as const;
  const parsed = z.array(z.array(z.string().max(400)).max(40)).min(1).max(60).safeParse(values);
  if (!parsed.success) return { error: "Bài làm không hợp lệ." } as const;
  const token = (await cookies()).get(`attempt-${id}`)?.value;
  if (!token || !z.uuid().safeParse(token).success) return { error: "Phiên đã hết hạn. Hãy tải lại bài tập." } as const;
  const assignment = await getAssignment(id);
  if (!assignment) return { error: "Bài tập đã đóng hoặc hết hạn." } as const;
  const { db, data, template, items } = assignment;
  const limitError = await attemptLimit(db, id, "finish");
  if (limitError) return { error: limitError } as const;
  if (parsed.data.length !== items.length) return { error: "Hãy hoàn thành tất cả các mục trước khi nộp." } as const;
  const result = grade(template, items, parsed.data);
  const { data: saved, error } = await db.rpc("finish_attempt", {
    p_assignment: id, p_attempt: token, p_answers: parsed.data.map((answer, index) => ({
      prompt: items[index].prompt, answer, correct: result.correct[index],
    })), p_score: result.score, p_total: result.total,
  }).maybeSingle();
  if (error || !saved) return { error: "Chưa nộp được bài. Kiểm tra hạn và thử lại." } as const;
  const record = saved as { score: number | null; total: number; answers: { answer: string[]; correct: boolean | null }[] };
  return { score: data.show_score ? record.score : null, total: record.total,
    ...(data.show_review && { review: missedReview(items, record.answers) }) };
}
