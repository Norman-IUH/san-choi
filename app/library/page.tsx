import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { VocabularyLibrary } from "@/components/VocabularyLibrary";
import { account, check } from "@/lib/supabase";
import { levels, normalize, skills } from "@/lib/game";
import { starterLessons, vocabularyCatalog } from "@/lib/vocabulary-catalog";
import { listBankWords } from "@/lib/vocabulary-server";
import { difficultyLabels, lessonSchema } from "@/lib/vocabulary-bank";
import { importBank } from "./actions";

export const metadata = { title: "Thư viện tiếng Anh" };
type Query = { lesson?: string; copy?: string; starter?: string; saved?: string; problem?: string; filter?: string;
  level?: string; skill?: string; topic?: string; unit?: string; difficulty?: string };

export default async function Library({ searchParams }: { searchParams: Promise<Query> }) {
  const [{ db, user }, query] = await Promise.all([account(true), searchParams]);
  const [privateWords, { data, error }] = await Promise.all([
    listBankWords(db, user.id),
    db.from("vocabulary_lessons").select("id,title,level,skill,topic,unit,difficulty,entry_keys").eq("owner_id", user.id).order("title"),
  ]);
  check(error, "list_vocabulary_lessons");
  const lessons = data ?? [];
  const id = query.lesson ?? query.copy;
  const existing = z.uuid().safeParse(id).success ? lessons.find(row => row.id === id) : undefined;
  if (id && !existing) notFound();
  const starter = starterLessons.find(item => item.id === query.starter);
  const initial = existing ? {
    ...lessonSchema.parse(existing), id: query.lesson ? existing.id : undefined,
    title: query.copy ? existing.title.slice(0, 88) + " (bản sao)" : existing.title,
  } : starter ? lessonSchema.parse({ ...starter, difficulty: "gentle", skill: "Vocabulary", entry_keys: starter.keys }) : undefined;
  const filter = typeof query.filter === "string" ? normalize(query.filter) : "";
  const facets = [
    { name: "level", label: "Cấp độ", values: levels },
    { name: "skill", label: "Kỹ năng", values: skills },
    { name: "topic", label: "Chủ đề", values: [...new Set(lessons.map(row => row.topic))].sort() },
    { name: "unit", label: "Unit", values: [...new Set(lessons.map(row => row.unit))].sort() },
    { name: "difficulty", label: "Độ khó", values: Object.keys(difficultyLabels) },
  ] as const;
  const filtered = lessons.filter(row => normalize([row.title, row.level, row.skill, row.topic, row.unit].join(" ")).includes(filter) &&
    facets.every(({ name, values }) => !values.some(value => query[name] === value) || query[name] === row[name]));
  return <div className="page stack bank-page">
    <header className="section-head">
      <div><Link className="back" href="/activities">← Hoạt động của tôi</Link><h1>Thư viện tiếng Anh</h1></div>
      <div className="inline-actions"><Link className="button primary" href="/library/words/new">Thêm từ</Link>
        <Link className="button" href="/library/export" prefetch={false} download>Tải CSV</Link></div>
    </header>
    {query.problem && <p role="alert" className="notice error">{query.problem}</p>}
    {query.saved && <p role="status" className="notice">{query.saved === "import" ? "Đã nhập từ mới. Từ và nghĩa trùng cấp độ được giữ lại." : "Đã lưu từ vựng."}</p>}
    <details className="panel">
      <summary>Nhập CSV hoặc XLSX</summary>
      <form action={importBank} className="stack bank-import">
        <p>Cột bắt buộc là <code>word</code> và <code>meaning</code>. Có thể kèm <code>level</code>, <code>topic</code>, <code>part</code>, <code>ipa</code>, <code>example</code>, <code>related</code>.</p>
        <div className="form-grid">
          <label>Tệp từ vựng<input name="file" type="file" required accept=".csv,.xlsx"/></label>
          <label>Cấp độ mặc định<select name="level">{levels.map(level => <option key={level}>{level}</option>)}</select></label>
          <label>Chủ đề mặc định<input name="topic" required maxLength={80}/></label>
        </div>
        <button className="button primary">Nhập từ vựng</button>
      </form>
    </details>
    <section className="stack" aria-labelledby="starter-lessons">
      <div><h2 id="starter-lessons">Bài học mở đầu</h2><p className="muted">Học liệu do Sân Chơi biên soạn, phân cấp nội bộ.</p></div>
      <div className="bank-starters">{starterLessons.map(lesson => <Link href={`/library?starter=${lesson.id}#bank-title`} className="panel" key={lesson.id}>
        <span className={`sample-art sample-art-${lesson.id}`} aria-hidden="true"/>
        <small>{lesson.level}</small><strong lang="en">{lesson.title}</strong><span>{lesson.topic}</span>
      </Link>)}</div>
    </section>
    <VocabularyLibrary key={existing?.id ?? query.starter ?? "all"} words={[...vocabularyCatalog, ...privateWords]} initial={initial}/>
    <section className="panel stack" id="bai-hoc">
      <h2>Bài học đã lưu</h2>
      <form className="stack" action="/library#bai-hoc"><div className="bank-filters">
        <label>Tìm bài học<input name="filter" type="search" defaultValue={filter}/></label>
        {facets.map(({ name, label, values }) => <label key={name}>{label} bài đã lưu
          <select name={name} defaultValue={query[name] ?? ""}><option value="">Tất cả</option>
            {values.map(value => <option key={value} value={value}>{name === "difficulty" ? difficultyLabels[value as keyof typeof difficultyLabels] : value}</option>)}</select></label>)}
      </div><button className="button">Lọc bài học</button></form>
      {filtered.length ? <ul className="bank-lesson-list">{filtered.map(lesson => <li key={lesson.id}>
        <Link href={`/library/${lesson.id}`}>{lesson.title}</Link><span>{lesson.level} · {lesson.skill} · {lesson.topic} · {lesson.unit}</span>
      </li>)}</ul> : <p>Chưa có bài học phù hợp.</p>}
    </section>
  </div>;
}
