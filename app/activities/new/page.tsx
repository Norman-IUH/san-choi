import Link from "next/link";
import { account } from "@/lib/supabase";
import { Templates } from "@/components/Templates";
import { Editor } from "@/components/Editor";
import { isTemplate, templates } from "@/lib/game";
import { importDemo } from "../actions";
import { isAudioPractice, isPhonics, isReading, listeningModes, readingModes, practiceModeSchema, practiceTemplate } from "@/lib/games/practice";
import { practiceSample } from "@/lib/practice-samples";
import { readingSample } from "@/lib/reading-samples";
import { builtInMediaUrls } from "@/lib/media";
import { grammarSample, grammarTopics } from "@/lib/grammar-samples";
import { levels } from "@/lib/game";
export default async function Create({ searchParams }: { searchParams: Promise<{ template?: string; practice?: string; grammar?: string }> }) {
  await account(true);
  const { template, practice, grammar } = await searchParams;
  const grammarActivity = grammar ? grammarSample(grammar) : null;
  if (grammarActivity) return <div className="narrow wide stack">
    <Link className="back" href="/activities/new#grammar">← Chọn chủ điểm</Link><h1 lang="en">{grammarActivity.title}</h1>
    <Editor id={null} template={grammarActivity.template} practiceMode="grammar" content={grammarActivity.items}
      initial={{ title: grammarActivity.title, subject: "English", description: "", grade: grammarActivity.level, tags: "Grammar", visibility: "private" }}/>
  </div>;
  const mode = practiceModeSchema.safeParse(practice);
  if (mode.success && isReading(mode.data)) {
    const sample = readingSample(mode.data);
    return <div className="narrow wide stack"><Link className="back" href="/activities/new#reading">← Chọn bài đọc</Link>
      <h1 lang="en">{sample.modeTitle}</h1>
      <Editor id={null} template={sample.template} practiceMode={mode.data} content={sample.items} assets={builtInMediaUrls(sample.items)}
        initial={{ title: sample.title, subject: "English", description: "", grade: sample.level, tags: "Reading", visibility: "private" }}/>
    </div>;
  }
  if (mode.success && isAudioPractice(mode.data)) {
    const { title, item, items } = practiceSample(mode.data);
    return <div className="narrow wide stack"><Link className="back" href="/activities/new#english-practice">← Chọn bài luyện</Link>
      <h1 lang="en">{title}</h1>
      {isPhonics(mode.data) && <p className="notice">Đính kèm clip đã kiểm tra. Dùng âm của chữ cái, âm đầu hoặc âm cuối theo câu hỏi.</p>}
      <Editor id={null} template={practiceTemplate(mode.data)} practiceMode={mode.data} content={items}
        assets={builtInMediaUrls(items)} initial={{ title, subject: "English", description: "", grade: item.english!.level!,
          tags: item.english!.skill!, visibility: "private" }}/></div>;
  }
  return <div className={template ? "narrow wide" : "page"}><Link className="back" href="/activities">← Hoạt động của tôi</Link>
    {template && isTemplate(template) ? <><div className="section-head"><h1>{templates[template].title}</h1>
      <form action={importDemo}><input type="hidden" name="template" value={template}/><button className="button">Dùng nội dung mẫu</button></form></div>
      <Editor id={null} template={template}/></>
      : <div className="stack"><h1>Chọn mẫu hoạt động</h1>
        <section id="english-practice" className="panel stack"><h2>Luyện nghe và ngữ âm</h2>
          <div className="inline-actions">{Object.entries(listeningModes).map(([id, name]) =>
            <Link key={id} className="button" href={`/activities/new?practice=${id}`} lang="en">{name}</Link>)}</div>
        </section><section id="reading" className="panel stack"><h2>Luyện đọc</h2>
          <div className="inline-actions">{Object.entries(readingModes).map(([id, name]) =>
            <Link key={id} className="button" href={`/activities/new?practice=${id}`} lang="en">{name}</Link>)}</div>
        </section><section id="grammar" className="panel stack"><h2>Luyện ngữ pháp</h2>
          <p>Chủ điểm được Sân Chơi phân cấp cho lớp học.</p>
          {levels.map(level => <details key={level}><summary>{level}</summary><div className="inline-actions">
            {grammarTopics.filter(topic => topic.level === level).map(topic => <Link className="button" key={topic.key}
              href={`/activities/new?grammar=${topic.key}`} lang="en">{topic.title}</Link>)}
          </div></details>)}
        </section><Templates creator/></div>}</div>;
}
