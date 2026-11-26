import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { account, check } from "@/lib/supabase";
export default async function Result({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { db }] = await Promise.all([params, account(true)]);
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await db.from("attempts").select("*").eq("id", id).not("completed_at", "is", null).maybeSingle();
  check(error, "attempt_detail");
  if (!data) notFound();
  const answers = data.answers as { prompt: string; answer: string[]; correct: boolean | null }[];
  return <div className="narrow wide stack"><Link className="back" href={`/assignments/${data.assignment_id}`}>← Bài giao</Link>
    <h1>Bài làm của {data.nickname}</h1><p>{data.score === null ? "Hoạt động không chấm điểm" : `${data.score}/${data.total} điểm`} · {Math.max(0, Math.round((Date.parse(data.completed_at) - Date.parse(data.started_at)) / 1000))} giây</p>
    <ol className="stack">{answers.map((entry, i) => <li className="panel" key={i}><strong>{entry.prompt}</strong>
      <p>{entry.answer.join(" / ") || "—"}{entry.correct !== null && (entry.correct ? " · Đúng" : " · Sai")}</p></li>)}</ol>
  </div>;
}
