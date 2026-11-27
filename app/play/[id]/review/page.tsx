import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { z } from "zod";
import { assessmentSchema, type ManualReview } from "@/lib/games/productive";
import { allowedTeacher, privilegedDatabase, serverConfigured } from "@/lib/supabase";

export const metadata = { title: "Nhận xét bài làm", robots: { index: false, follow: false } };

export default async function PublishedReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!serverConfigured || !z.uuid().safeParse(id).success) notFound();
  const receipt = (await cookies()).get(`receipt-${id}`)?.value;
  if (!z.uuid().safeParse(receipt).success) notFound();
  const { data } = await privilegedDatabase().from("attempts")
    .select("score,total,assignments!inner(owner_id,title,assessment,show_score,classroom_id),manual_reviews!inner(state,scores,total,feedback,published_at)")
    .eq("id", receipt!).eq("assignment_id", id).not("completed_at", "is", null).maybeSingle()
    .overrideTypes<{ score: number | null; total: number; assignments: { owner_id: string; title: string; assessment: unknown; show_score: boolean; classroom_id: string | null };
      manual_reviews: ManualReview }, { merge: false }>();
  if (!data || data.assignments.classroom_id || !allowedTeacher(data.assignments?.owner_id)) notFound();
  const snapshot = assessmentSchema.safeParse(data.assignments.assessment);
  if (!snapshot.success) notFound();
  const review = data.manual_reviews;
  const maximum = snapshot.data.rubric.reduce((sum, row) => sum + row.max, 0);
  const automatic = data.score !== null && data.assignments.show_score ? { score: data.score, total: data.total } : null;
  return <div className="narrow stack"><h1>Nhận xét bài làm</h1><p>{data.assignments.title}</p>
    {review?.state === "published" ? <section className="panel stack">
      <h2>{(review.total ?? 0) + (automatic?.score ?? 0)}/{maximum + (automatic?.total ?? 0)} điểm</h2>
      {data.score !== null && <p>{automatic && `Tự động ${automatic.score}/${automatic.total} · `}Câu viết mở {review.total}/{maximum}</p>}
      <ul>{snapshot.data.rubric.map((row, i) => <li key={row.title}>{row.title} · {review.scores[i]}/{row.max}</li>)}</ul>
      {review.feedback && <p className="assessment-response">{review.feedback}</p>}
    </section> : <p role="status" className="notice">Đã nộp bài. Em có thể mở lại trang này sau khi giáo viên công bố.</p>}
  </div>;
}
