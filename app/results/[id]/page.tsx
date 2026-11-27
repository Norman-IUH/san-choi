import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { account, check, privilegedDatabase } from "@/lib/supabase";
import { itemSchema, readableResponse } from "@/lib/game";
import { assessmentSchema } from "@/lib/games/productive";
import { AssessmentForm } from "@/components/AssessmentForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { removeTeacherVoice } from "../review-actions";
import { voicePlayable } from "@/lib/voice-server";
export default async function Result({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ review?: string }> }) {
  const [{ id }, { db }, query] = await Promise.all([params, account(true), searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await db.from("attempts").select("*,assignments(content,assessment),manual_reviews(*)").eq("id", id).not("completed_at", "is", null).maybeSingle();
  check(error, "attempt_detail");
  if (!data) notFound();
  const answers = data.answers as { prompt: string; answer: string[]; correct: boolean | null }[];
  const source = z.array(itemSchema).safeParse(data.assignments?.content);
  const snapshot = assessmentSchema.safeParse(data.assignments?.assessment);
  const writing = source.success ? source.data.find(item => item.practice?.starters?.open)?.practice?.starters : undefined;
  const writingScenes = writing?.visuals ?? (writing?.scene ? [writing.scene] : []);
  const voice = snapshot.success && snapshot.data.skill === "Speaking" ? await privilegedDatabase().from("voice_recordings")
    .select("item_index,expires_at,seconds").eq("attempt_id", id) : null;
  check(voice?.error ?? null, "attempt_recordings");
  const clips = new Map(voice?.data?.map(row => [row.item_index, row]));
  const review = data.manual_reviews;
  const next = snapshot.success ? await db.from("attempts").select("id,manual_reviews!inner(state)")
    .eq("manual_reviews.state", "pending").neq("id", id).order("completed_at").limit(1).maybeSingle() : null;
  check(next?.error ?? null, "next_manual_review");
  return <div className="narrow wide stack"><Link className="back" href={`/assignments/${data.assignment_id}`}>← Bài giao</Link>
    <h1>Bài làm của {data.nickname}</h1><p>{snapshot.success ? `Chấm thủ công · ${review?.state === "published" ? "Đã công bố" : review?.state === "reviewed" ? "Đã chấm" : "Chờ chấm"}` : data.score === null ? "Hoạt động không chấm điểm" : `${data.score}/${data.total} điểm`} · {Math.max(0, Math.round((Date.parse(data.completed_at) - Date.parse(data.started_at)) / 1000))} giây</p>
    {query.review === "saved" && <p role="status" className="notice">Đã lưu đánh giá.</p>}
    {writingScenes.length > 0 && <section className="panel starter-picture"><h2>Tranh dùng để chấm câu viết mở</h2>
      {data.score !== null && <p>{data.score}/{data.total} điểm tự động</p>}
      <div className={writingScenes.length > 1 ? "mover-scenes" : undefined}>{writingScenes.map((scene, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- These built-in pictures come from the assignment snapshot.
        <img className="lesson-image" key={scene} src={scene} alt={`Tranh ${i + 1} của đề viết`}/>
      ))}</div>
    </section>}
    {query.review === "voice-removed" && <p role="status" className="notice">Đã xóa bản ghi.</p>}
    {query.review === "voice-error" && <p role="alert" className="notice error">Chưa xóa được bản ghi. Hãy thử lại.</p>}
    <ol className="stack">{answers.map((entry, i) => <li className="panel" key={i}><strong>{entry.prompt}</strong>
      <p className="assessment-response">{(source.success && source.data[i] ? readableResponse(source.data[i], entry.answer) : entry.answer).join(" / ") || "—"}
        {entry.correct !== null && (entry.correct ? " · Đúng" : " · Sai")}</p>
      {clips.has(i) && <div className="stack">
        {voicePlayable(clips.get(i)!.expires_at)
          ? <><audio controls preload="none" src={`/results/${id}/voice/${i}`} aria-label={`Bản ghi mục ${i + 1}`}/>
            <a href={`/results/${id}/voice/${i}?download=1`}>Tải bản ghi mục {i + 1}</a></>
          : <p>Bản ghi đã hết hạn.</p>}
        <form action={removeTeacherVoice.bind(null, id, String(i))}><ConfirmButton message="Xóa bản ghi của mục này?">{`Xóa bản ghi mục ${i + 1}`}</ConfirmButton></form>
      </div>}
      </li>)}</ol>
    {snapshot.success && review && <AssessmentForm key={review.revision} id={id} rubric={snapshot.data.rubric} review={review}/>}
    {next?.data && <Link className="button" href={`/results/${next.data.id}`}>Bài chờ chấm tiếp theo →</Link>}
  </div>;
}
