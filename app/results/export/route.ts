import type { NextRequest } from "next/server";
import { z } from "zod";
import { account } from "@/lib/supabase";
import { csv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("assignment");
  if (!z.uuid().safeParse(id).success) return new Response(null, { status: 404 });
  const { db } = await account(true);
  const { data: assignment } = await db.from("assignments").select("id").eq("id", id!).maybeSingle();
  if (!assignment) return new Response(null, { status: 404 });
  const rows: (string | number | null)[][] = [["Biệt danh", "Điểm", "Tổng", "Bắt đầu", "Hoàn thành"]];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from("attempts").select("id,nickname,score,total,started_at,completed_at").eq("assignment_id", id!)
      .not("completed_at", "is", null).order("id").range(offset, offset + 499);
    if (error) return new Response("Chưa tạo được báo cáo.", { status: 500 });
    rows.push(...data.map(row => [row.nickname, row.score, row.total, row.started_at, row.completed_at]));
    if (data.length < 500) break;
  }
  return new Response(csv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="ket-qua.csv"', "Cache-Control": "private, no-store" } });
}
