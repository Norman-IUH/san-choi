import type { NextRequest } from "next/server";
import { z } from "zod";
import { account } from "@/lib/supabase";
import { resultWorkbook, type ResultAssignment, type ResultAttempt } from "@/lib/result-workbook";

const date = z.iso.date().optional();
const badRequest = () => new Response("Chọn bài giao và khoảng ngày hợp lệ.", { status: 400 });
const failure = () => new Response("Chưa tạo được báo cáo Excel. Hãy thử lại.", { status: 500 });

export async function GET(request: NextRequest) {
  const { db, user } = await account(true);
  const params = request.nextUrl.searchParams;
  const ids = [...new Set(params.getAll("assignment"))];
  const from = date.safeParse(params.get("from") || undefined);
  const to = date.safeParse(params.get("to") || undefined);
  if (ids.length > 100 || !ids.every(id => z.uuid().safeParse(id).success) || !from.success || !to.success ||
      (from.data && to.data && from.data > to.data)) return badRequest();

  const assignments: ResultAssignment[] = [];
  for (let offset = 0; ; offset += 100) {
    let query = db.from("assignments").select("id,title,assessment,content").eq("owner_id", user.id);
    if (ids.length) query = query.in("id", ids);
    const { data, error } = await query.order("id").range(offset, offset + 99);
    if (error) return failure();
    assignments.push(...data);
    if (data.length < 100) break;
  }
  if (ids.length && ids.length !== assignments.length) return new Response(null, { status: 404 });

  const attempts: ResultAttempt[] = [];
  let answerCount = 0;
  for (let offset = 0; assignments.length; offset += 250) {
    let query = db.from("attempts").select("id,assignment_id,nickname,score,total,started_at,completed_at,answers,manual_reviews(state,total),assignments!inner(owner_id)")
      .eq("assignments.owner_id", user.id);
    if (ids.length) query = query.in("assignment_id", ids);
    if (from.data) query = query.gte("started_at", new Date(`${from.data}T00:00:00+07:00`).toISOString());
    if (to.data) query = query.lt("started_at", new Date(Date.parse(`${to.data}T00:00:00+07:00`) + 86400000).toISOString());
    const { data, error } = await query.order("id").range(offset, offset + 249)
      .overrideTypes<ResultAttempt[], { merge: false }>();
    if (error) return failure();
    attempts.push(...data);
    for (const row of data) if (Array.isArray(row.answers)) answerCount += row.answers.length;
    // shortcut: bounded in-process generation, use a queued export if teachers need larger reports.
    if (attempts.length > 10000 || answerCount > 100000) {
      return new Response("Báo cáo quá lớn. Hãy chọn ít bài giao hơn hoặc thu hẹp khoảng ngày.", { status: 413 });
    }
    if (data.length < 250) break;
  }

  try {
    const workbook = await resultWorkbook(assignments, attempts, from.data, to.data).toBuffer();
    return new Response(new Uint8Array(workbook), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="ket-qua.xlsx"',
      "Cache-Control": "private, no-store",
    } });
  } catch {
    return failure();
  }
}
