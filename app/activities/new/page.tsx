import Link from "next/link";
import { account } from "@/lib/supabase";
import { Templates } from "@/components/Templates";
import { Editor } from "@/components/Editor";
import { isTemplate, templates } from "@/lib/game";
import { importDemo } from "../actions";
import { isPhonics, practiceModes, practiceModeSchema, practiceTemplate } from "@/lib/games/practice";
import { practiceSample } from "@/lib/practice-samples";
import { builtInMediaUrls } from "@/lib/media";
export default async function Create({ searchParams }: { searchParams: Promise<{ template?: string; practice?: string }> }) {
  await account(true);
  const { template, practice } = await searchParams;
  const mode = practiceModeSchema.safeParse(practice);
  if (mode.success) {
    const { title, item } = practiceSample(mode.data);
    return <div className="narrow wide stack"><Link className="back" href="/activities/new#english-practice">← Chọn bài luyện</Link>
      <h1 lang="en">{title}</h1>
      {isPhonics(mode.data) && <p className="notice">Đính kèm clip đã kiểm tra. Dùng âm của chữ cái, âm đầu hoặc âm cuối theo câu hỏi.</p>}
      <Editor id={null} template={practiceTemplate(mode.data)} practiceMode={mode.data} content={[item]}
        assets={builtInMediaUrls([item])} initial={{ title, subject: "English", description: "", grade: item.english!.level!,
          tags: item.english!.skill!, visibility: "private" }}/></div>;
  }
  return <div className={template ? "narrow wide" : "page"}><Link className="back" href="/activities">← Hoạt động của tôi</Link>
    {template && isTemplate(template) ? <><div className="section-head"><h1>{templates[template].title}</h1>
      <form action={importDemo}><input type="hidden" name="template" value={template}/><button className="button">Dùng nội dung mẫu</button></form></div>
      <Editor id={null} template={template}/></>
      : <div className="stack"><h1>Chọn mẫu hoạt động</h1>
        <section id="english-practice" className="panel stack"><h2>Luyện nghe và ngữ âm</h2>
          <div className="inline-actions">{Object.entries(practiceModes).map(([id, name]) =>
            <Link key={id} className="button" href={`/activities/new?practice=${id}`} lang="en">{name}</Link>)}</div>
        </section><Templates creator/></div>}</div>;
}
