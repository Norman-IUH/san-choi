import Link from "next/link";
import { Search } from "lucide-react";
import { check, serverConfigured, privilegedDatabase, singleTeacher, teacherId } from "@/lib/supabase";
import { isTemplate, templates } from "@/lib/game";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cộng đồng" };
export default async function Community({ searchParams }: { searchParams: Promise<{ q?: string; template?: string }> }) {
  const { q, template } = await searchParams;
  const term = typeof q === "string" ? q.trim().slice(0, 100) : "";
  if (!serverConfigured || (singleTeacher && !teacherId)) return <div className="page stack"><h1>Cộng đồng</h1>
    <p className="notice" role="status">Thư viện cộng đồng cần kết nối máy chủ. Bạn vẫn có thể chơi thử các mẫu.</p>
    <Link className="button" href="/#mau">Khám phá các mẫu chơi thử</Link>
  </div>;
  let query = privilegedDatabase().from("activities").select("id,title,template")
    .eq("visibility", "public").eq("draft", false).is("deleted_at", null);
  if (singleTeacher && teacherId) query = query.eq("owner_id", teacherId);
  const safeTerm = term.replace(/[^\p{L}\p{M}\p{N} ]/gu, " ").trim();
  if (safeTerm) query = query.ilike("search_text", `%${safeTerm}%`);
  if (template && isTemplate(template)) query = query.eq("template", template);
  const result = await query.order("updated_at", { ascending: false }).limit(48);
  check(result.error, "community_list");
  const entries = result.data ?? [];
  return <div className="page stack"><h1>Cộng đồng</h1><form className="search"><label className="search-input"><Search size={18}/>
    <input name="q" aria-label="Tìm học liệu công khai" defaultValue={term} placeholder="Tìm học liệu công khai…"/></label>
    <select aria-label="Mẫu" name="template" defaultValue={template ?? ""}><option value="">Tất cả mẫu</option>
      {Object.entries(templates).map(([id, info]) => <option key={id} value={id}>{info.title}</option>)}</select><button className="button">Tìm</button></form>
    {entries.length ? <div className="activity-grid">{entries.map(row => {
      const meta = isTemplate(row.template) ? templates[row.template] : null;
      return <Link className="template-card" key={row.id} href={`/resource/${row.id}`}><span className={`template-picture ${meta?.color ?? "violet"}`}>{meta?.icon}</span>
        <div><strong>{row.title}</strong><small>{meta?.title}</small></div></Link>;
    })}</div> : <div className="empty"><h2>Chưa tìm thấy hoạt động công khai</h2><Link href="/#mau">Khám phá các mẫu chơi thử</Link></div>}</div>;
}
