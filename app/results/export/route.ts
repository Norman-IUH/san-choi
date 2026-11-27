import type { NextRequest } from "next/server";
import { z } from "zod";
import { account } from "@/lib/supabase";
import { csv } from "@/lib/csv";
import { assessmentSchema } from "@/lib/games/productive";
import { cambridgeLevels } from "@/lib/games/starters";

type ExportAttempt = {
  nickname: string; score: number | null; total: number; started_at: string; completed_at: string;
  manual_reviews: { total: number | null; state: string } | null;
};

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("assignment");
  if (!z.uuid().safeParse(id).success) return new Response(null, { status: 404 });
  const { db } = await account(true);
  const { data: assignment } = await db.from("assignments").select("id,assessment").eq("id", id!).maybeSingle();
  if (!assignment) return new Response(null, { status: 404 });
  const assessment = assessmentSchema.safeParse(assignment.assessment).data;
  const rubric = assessment && (assessment.level === cambridgeLevels.movers || assessment.level === cambridgeLevels.flyers)
    ? assessment.rubric : null;
  const rows: (string | number | null)[][] = [["Biệt danh", "Điểm", "Tổng", "Bắt đầu", "Hoàn thành"]];
  if (rubric) rows[0].push("Điểm tự động", "Điểm thủ công", "Trạng thái chấm");
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from("attempts").select("id,nickname,score,total,started_at,completed_at,manual_reviews(total,state)").eq("assignment_id", id!)
      .not("completed_at", "is", null).order("id").range(offset, offset + 499).overrideTypes<ExportAttempt[], { merge: false }>();
    if (error) return new Response("Chưa tạo được báo cáo.", { status: 500 });
    rows.push(...data.map(row => {
      if (!rubric) return [row.nickname, row.score, row.total, row.started_at, row.completed_at];
      const manual = row.manual_reviews;
      return [row.nickname, manual?.total == null ? null : (row.score ?? 0) + manual.total,
        row.total + rubric.reduce((sum, criterion) => sum + criterion.max, 0), row.started_at, row.completed_at,
        row.score, manual?.total ?? null, manual?.state ?? "pending"];
    }));
    if (data.length < 500) break;
  }
  return new Response(csv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="ket-qua.csv"', "Cache-Control": "private, no-store" } });
}
