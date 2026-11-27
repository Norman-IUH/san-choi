import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { setAssignmentClosed } from "@/app/activities/actions";
import { addClassroomSubmission } from "@/app/results/review-actions";
import { CopyLink } from "@/components/CopyLink";
import { account, check, urlFor } from "@/lib/supabase";

export default async function Assignment({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{saved?: string; review?: string}> }) {
  const [{ id }, { db }, { saved, review }] = await Promise.all([params, account(true), searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();
  const [assignment, attempts] = await Promise.all([
    db.from("assignments").select("id,title,deadline,closed,assessment").eq("id", id).maybeSingle(),
    db.from("attempts").select("id,nickname,score,total,started_at,completed_at,manual_reviews(state,total)").eq("assignment_id", id).not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(100)
      .overrideTypes<{ id: string; nickname: string; score: number | null; total: number; started_at: string;
        completed_at: string; manual_reviews: { state: string; total: number | null } | null }[], { merge: false }>(),
  ]);
  check(assignment.error, "assignment_detail");
  check(attempts.error, "attempts");
  if (!assignment.data) notFound();
  const row = assignment.data;
  const completed = attempts.data ?? [];
  return <div className="narrow wide stack"><Link className="back" href="/results">← Kết quả</Link>
    <h1>{row.title}</h1>{saved && <p className="notice" role="status">Đã lưu thay đổi.</p>}
    <section className="panel stack"><h2>Link giao bài</h2>
      <CopyLink url={urlFor(`/play/${id}`)}/>
      <p>{row.closed ? "Đã đóng" : row.deadline ? `Hạn nộp ${new Date(row.deadline).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}` : "Đang mở · Không giới hạn thời gian"}</p>
      <form action={setAssignmentClosed.bind(null, id, !row.closed)}><button className="button">{row.closed ? "Mở lại bài tập" : "Đóng bài tập"}</button></form>
    </section>
    {row.assessment?.skill === "Speaking" && <details className="panel"><summary>Chấm trực tiếp trên lớp</summary>
      <form action={addClassroomSubmission.bind(null, id)} className="stack">
        {review === "invalid" && <p role="alert">Kiểm tra biệt danh.</p>}
        <label>Biệt danh để chấm trực tiếp<input name="nickname" required maxLength={80}/></label>
        <button className="button">Mở rubric chấm trực tiếp</button>
      </form></details>}
    <section className="panel stack"><div className="section-head"><h2>Bài đã nộp gần đây</h2><a className="button" href={`/results/export?assignment=${id}`}>Tải CSV</a></div>
      {!completed.length ? <p>Chưa có bài nộp.</p> : <div className="table-wrap"><table><thead><tr><th>Biệt danh</th><th>Điểm</th><th>Thời gian</th></tr></thead><tbody>
        {completed.map(attempt => <tr key={attempt.id}><td><Link href={`/results/${attempt.id}`}>{attempt.nickname}</Link></td>
          <td>{attempt.manual_reviews && attempt.score !== null && `${attempt.score}/${attempt.total} tự động · `}
            {attempt.manual_reviews ? (attempt.manual_reviews.total == null ? "Chờ chấm" : `${attempt.manual_reviews.total} · ${attempt.manual_reviews.state === "published" ? "Đã công bố" : "Đã chấm"}`) : attempt.score === null ? "—" : `${attempt.score}/${attempt.total}`}</td>
          <td>{Math.max(0, Math.round((Date.parse(attempt.completed_at) - Date.parse(attempt.started_at)) / 1000))} giây</td></tr>)}</tbody></table></div>}
    </section></div>;
}
