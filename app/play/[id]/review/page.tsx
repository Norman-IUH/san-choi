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
    .select("assignments!inner(owner_id,title,assessment),manual_reviews!inner(state,scores,total,feedback,published_at)")
    .eq("id", receipt!).eq("assignment_id", id).not("completed_at", "is", null).maybeSingle()
    .overrideTypes<{ assignments: { owner_id: string; title: string; assessment: unknown }; manual_reviews: ManualReview }, { merge: false }>();
  if (!data || !allowedTeacher(data.assignments?.owner_id)) notFound();
  const snapshot = assessmentSchema.safeParse(data.assignments.assessment);
  if (!snapshot.success) notFound();
  const review = data.manual_reviews;
  return <div className="narrow stack"><h1>Nhận xét bài làm</h1><p>{data.assignments.title}</p>
    {review?.state === "published" ? <section className="panel stack">
      <h2>{review.total}/{snapshot.data.rubric.reduce((sum, row) => sum + row.max, 0)} điểm</h2>
      <ul>{snapshot.data.rubric.map((row, i) => <li key={row.title}>{row.title} · {review.scores[i]}/{row.max}</li>)}</ul>
      {review.feedback && <p className="assessment-response">{review.feedback}</p>}
    </section> : <p role="status" className="notice">Đã nộp bài. Em có thể mở lại trang này sau khi giáo viên công bố.</p>}
  </div>;
}
