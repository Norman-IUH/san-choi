import Link from "next/link";
import { account } from "@/lib/supabase";
import { Templates } from "@/components/Templates";
import { Editor } from "@/components/Editor";
import { isTemplate, templates } from "@/lib/game";
import { importDemo } from "../actions";
export default async function Create({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  await account(true);
  const { template } = await searchParams;
  return <div className={template ? "narrow wide" : "page"}><Link className="back" href="/activities">← Hoạt động của tôi</Link>
    {template && isTemplate(template) ? <><div className="section-head"><h1>{templates[template].title}</h1>
      <form action={importDemo}><input type="hidden" name="template" value={template}/><button className="button">Dùng nội dung mẫu</button></form></div>
      <Editor id={null} template={template}/></>
      : <><h1>Chọn mẫu hoạt động</h1><Templates creator/></>}</div>;
}
