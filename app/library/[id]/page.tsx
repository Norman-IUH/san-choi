import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Player } from "@/components/Player";
import { templates, templateIds, isTemplate } from "@/lib/game";
import { localPlay } from "@/lib/local-play";
import { mediaUrls } from "@/lib/media-server";
import { account, check } from "@/lib/supabase";
import { difficultyLabels, lessonSchema, vocabularyGame } from "@/lib/vocabulary-bank";
import { loadWords } from "@/lib/vocabulary-server";
import { createLessonGame } from "../actions";
import { emptyPlan, lessonPlanSchema } from "@/lib/lesson-plan";
import { PlanEdit, PlanView, type LessonQuery } from "./plan";

export default async function Lesson({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<LessonQuery>;
}) {
  const [{ id }, query, { db, user }] = await Promise.all([params, searchParams, account(true)]);
  if (id === "new") return <PlanEdit db={db} owner={user.id} id={null} sample={query.sample}/>;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await db.from("vocabulary_lessons").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle();
  check(error, "read_vocabulary_lesson");
  if (!data) notFound();
  const lesson = lessonSchema.parse(data);
  const plan = data.plan ? lessonPlanSchema.parse(data.plan) : null;
  if (query.mode === "edit") return <PlanEdit db={db} owner={user.id} id={id} initial={lesson} startingPlan={plan ?? emptyPlan}/>;
  if (query.mode === "present" && plan) return <div className="page stack lesson-presentation">
    <PlanView db={db} owner={user.id} id={id} plan={plan} lesson={lesson} query={query}/>
  </div>;
  const words = await loadWords(db, user.id, lesson.entry_keys);
  const copies = await db.from("activities").select("id,title,template,draft").eq("vocabulary_lesson_id", id)
    .eq("owner_id", user.id).is("deleted_at", null).order("updated_at", { ascending: false });
  check(copies.error, "list_lesson_games");
  const games = new Map(templateIds.map(template =>
    [template, words.length === lesson.entry_keys.length ? vocabularyGame(template, words, lesson.skill, lesson.difficulty) : null] as const));
  const active = query.game && isTemplate(query.game) ? query.game : "flash-cards";
  const content = games.get(active);
  const assets = content ? await mediaUrls(content, user.id) : {};
  return <div className="narrow wide stack bank-page">
    <Link className="back" href="/library">← Thư viện tiếng Anh</Link>
    <div className="section-head">
      <div><p className="muted">{lesson.level} · {lesson.unit}</p><h1>{lesson.title}</h1>
        <p>{lesson.topic} · {lesson.skill} · {difficultyLabels[lesson.difficulty]} · {words.length} từ</p></div>
      <div className="inline-actions"><Link className="button" href={`/library?lesson=${id}#bank-title`}>{plan ? "Chọn từ vựng" : "Sửa bài học"}</Link>
        {!plan && <Link className="button" href={`/teaching/print/lesson/${id}`}>In học liệu</Link>}
        {!plan && <><Link className="button" href={`/library?copy=${id}#bank-title`}>Sao chép bài học</Link>
          <Link className="button primary" href={`/library/${id}?mode=edit`}>Thêm tiến trình giáo án</Link></>}</div>
    </div>
    {query.saved === "plan" && <p role="status" className="notice">Đã lưu giáo án.</p>}
    {query.omitted && /^\d{1,2}$/.test(query.omitted) && <p role="status" className="notice">Bản sao bỏ qua {query.omitted} hoạt động hiện không khả dụng.</p>}
    {query.problem && query.problem !== "deadline" && <p role="alert" className="notice error">{query.problem === "draft"
      ? "Hãy lưu giáo án ở trạng thái sẵn sàng trước khi giao." : query.problem === "classroom"
        ? "Kiểm tra lớp đang hoạt động, người nhận và số lượt làm." : query.problem}</p>}
    {plan && <PlanView db={db} owner={user.id} id={id} plan={plan} lesson={lesson} query={query}/>}
    {words.length !== lesson.entry_keys.length && <p role="alert" className="notice error">Một số từ không còn khả dụng. Hãy cập nhật bài học.</p>}
    {!!lesson.entry_keys.length && <><section className="panel stack">
      <h2>Trò chơi từ bài học</h2>
      <form className="inline-actions">
        <label>Mẫu trò chơi<select name="game" defaultValue={active}>{[...games].map(([template, items]) =>
          <option key={template} value={template} disabled={!items}>{templates[template].title}{items ? "" : " · cần nội dung khác"}</option>)}</select></label>
        <button className="button">Xem trước</button>
      </form>
      {content ? <form action={createLessonGame.bind(null, id)}><input type="hidden" name="template" value={active}/>
        <button className="button primary">Tạo bản soạn từ mẫu này</button></form>
        : <p>Mẫu này cần cấu trúc hoặc học liệu bổ sung.</p>}
    </section>
    {content && <Player key={active} title={lesson.title} {...localPlay(active, content, assets)}/>}
    <section className="panel stack">
      <h2>Hoạt động đã tạo</h2>
      {copies.data?.length ? <ul className="bank-lesson-list">{copies.data.map(row => <li key={row.id}>
        <Link href={`/activities/${row.id}`}>{row.title}</Link>
        <span>{isTemplate(row.template) ? templates[row.template].title : row.template}{row.draft ? " · Bản nháp" : ""}</span>
      </li>)}</ul> : <p>Chưa có hoạt động đã lưu cho bài học này.</p>}
    </section></>}
  </div>;
}
