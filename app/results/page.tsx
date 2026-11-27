import Link from "next/link";
import { account, check } from "@/lib/supabase";
import { levels } from "@/lib/game";
import { z } from "zod";
import type { ManualReview } from "@/lib/games/productive";
import { cleanExpiredVoice } from "./review-actions";
import { voicePolicy } from "@/lib/voice-server";

const states = { pending: "Chờ chấm", reviewed: "Đã chấm", published: "Đã công bố" } as const;

export default async function Results({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ db }, query] = await Promise.all([account(true), searchParams]);
  const state = z.enum(["pending", "reviewed", "published"]).safeParse(query.state).data;
  const skill = z.enum(["Speaking", "Writing"]).safeParse(query.skill).data;
  const level = z.enum(levels).safeParse(query.level).data;
  const lesson = z.uuid().safeParse(query.lesson).data;
  const assignment = z.uuid().safeParse(query.assignment).data;
  let queue = db.from("attempts").select("id,nickname,completed_at,assignments!inner(id,title,assessment,lesson_id),manual_reviews!inner(state,total)")
    .not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(100);
  if (state) queue = queue.eq("manual_reviews.state", state);
  if (skill) queue = queue.eq("assignments.assessment->>skill", skill);
  if (level) queue = queue.eq("assignments.assessment->>level", level);
  if (lesson) queue = queue.eq("assignments.lesson_id", lesson);
  if (assignment) queue = queue.eq("assignment_id", assignment);
  const [assignments, complete, count, reviewQueue, lessons] = await Promise.all([
    db.from("assignments").select("id,title,closed,created_at").order("created_at", { ascending: false }).limit(100),
    db.from("attempts").select("id", { count: "exact", head: true }).not("completed_at", "is", null),
    db.from("assignments").select("id", { count: "exact", head: true }),
    queue.overrideTypes<{ id: string; nickname: string; assignments: { title: string; assessment: { skill: string } };
      manual_reviews: Pick<ManualReview, "state"> }[], { merge: false }>(),
    db.from("vocabulary_lessons").select("id,title").order("title"),
  ]);
  check(assignments.error, "results_list"); check(complete.error, "complete_count"); check(count.error, "assignment_count");
  check(reviewQueue.error, "manual_review_queue"); check(lessons.error, "review_lessons");
  return <div className="page stack teacher-results"><h1>Kết quả</h1><div className="stats">
    <div className="panel"><strong>{count.count ?? 0}</strong><p>Bài đã giao</p></div>
    <div className="panel"><strong>{complete.count ?? 0}</strong><p>Bài đã nộp</p></div></div>
    <details className="panel"><summary>Xuất kết quả Excel</summary>
      <form className="stack" action="/results/export/xlsx" aria-label="Bộ lọc xuất Excel">
        <div className="form-grid">
          <label>Từ ngày<input type="date" name="from"/></label>
          <label>Đến ngày<input type="date" name="to"/></label>
        </div>
        {!!assignments.data?.length && <fieldset><legend>Bài giao</legend>
          <p>Để trống để xuất tất cả. Khoảng ngày lọc theo lúc học sinh bắt đầu làm bài, giờ Việt Nam.</p>
          <div className="form-grid">{assignments.data.map(row => <label className="check" key={row.id}>
            <input type="checkbox" name="assignment" value={row.id}/>{row.title}
          </label>)}</div>
        </fieldset>}
        <button className="button">Tải XLSX</button>
      </form>
    </details>
    <section className="panel stack" id="manual-reviews"><h2>Chấm Speaking và Writing</h2>
      {query.cleanup && <p role="status">{query.cleanup === "done" ? "Đã dọn bản ghi hết hạn và tệp rời đủ điều kiện." : "Chưa dọn xong. Hãy thử lại."}</p>}
      {(voicePolicy() || query.cleanup) && <form action={cleanExpiredVoice}><button className="button">Dọn bản ghi đã hết hạn</button></form>}
      <form className="stack" action="/results#manual-reviews"><div className="form-grid">
        <label>Trạng thái chấm<select name="state" defaultValue={state ?? ""}><option value="">Tất cả</option>
          {Object.entries(states).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Kỹ năng<select name="skill" defaultValue={skill ?? ""}><option value="">Tất cả</option><option>Speaking</option><option>Writing</option></select></label>
        <label>Cấp độ<select name="level" defaultValue={level ?? ""}><option value="">Tất cả</option>{levels.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Giáo án<select name="lesson" defaultValue={lesson ?? ""}><option value="">Tất cả</option>
          {lessons.data?.map(row => <option key={row.id} value={row.id}>{row.title}</option>)}</select></label>
        <label>Bài giao<select name="assignment" defaultValue={assignment ?? ""}><option value="">Tất cả</option>
          {assignments.data?.map(row => <option key={row.id} value={row.id}>{row.title}</option>)}</select></label>
      </div><button className="button">Lọc bài cần chấm</button></form>
      {reviewQueue.data?.length ? <ul className="assignment-list">{reviewQueue.data.map(row => <li key={row.id}>
        <Link href={`/results/${row.id}`}>{row.nickname} · {row.assignments.title}</Link>
        <span>{row.assignments.assessment?.skill} · {states[row.manual_reviews.state]}</span>
      </li>)}</ul> : <p>Chưa có bài phù hợp với bộ lọc.</p>}
    </section>
    <section className="panel stack"><h2>Bài giao gần đây</h2>
      {assignments.data?.length ? <ul className="assignment-list">{assignments.data.map(row => <li key={row.id}><Link href={`/assignments/${row.id}`}>{row.title}</Link><span>{row.closed ? "Đã đóng" : "Đang mở"}</span></li>)}</ul>
        : <p>Chưa có bài giao. <Link href="/activities">Chọn hoạt động để giao bài.</Link></p>}
    </section></div>;
}
