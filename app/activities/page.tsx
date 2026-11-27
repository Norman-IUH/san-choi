import Link from "next/link";
import Image from "next/image";
import { Folder, Heart, LayoutGrid, List, Plus, Search, Trash2, FileText, Share2, Library } from "lucide-react";
import { account, check } from "@/lib/supabase";
import { isTemplate, templates } from "@/lib/game";
import { changeFolder } from "./actions";
import { ConfirmButton } from "@/components/ConfirmButton";

const views = [
  ["all", "Tất cả hoạt động", Library], ["folder", "Thư mục", Folder], ["favorite", "Yêu thích", Heart],
  ["shared", "Đã chia sẻ", Share2], ["drafts", "Bản nháp", FileText], ["trash", "Thùng rác", Trash2],
] as const;
type Query = Record<string, string | undefined>;
export default async function Activities({ searchParams }: { searchParams: Promise<Query> }) {
  const [{ db, profile }, query] = await Promise.all([account(true), searchParams]);
  const { folder, view = "all", sort = "updated_at", layout = "grid", template } = query;
  const page = Math.max(1, Math.min(10000, parseInt(query.page ?? "") || 1));
  const term = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  const safeTerm = term.replace(/[^\p{L}\p{M}\p{N} ]/gu, " ").trim();
  let items = db.from("activities").select("id,title,description,template,subject,grade,draft,favorite,updated_at,folder_id", { count: "exact" });
  items = view === "trash" ? items.not("deleted_at", "is", null) : items.is("deleted_at", null);
  if (view === "favorite") items = items.eq("favorite", true);
  if (view === "shared") items = items.neq("visibility", "private").eq("draft", false);
  if (view === "drafts") items = items.eq("draft", true);
  if (folder && /^[a-f0-9-]{36}$/i.test(folder)) items = items.eq("folder_id", folder);
  if (template && isTemplate(template)) items = items.eq("template", template);
  if (safeTerm) items = items.ilike("search_text", `%${safeTerm}%`);
  const sorter = ["title", "created_at", "updated_at"].includes(sort) ? sort : "updated_at";
  const [{ data, count, error }, foldersResult] = await Promise.all([
    items.order(sorter, { ascending: sorter === "title" }).order("id").range((page - 1) * 12, page * 12 - 1),
    db.from("folders").select("*").order("name"),
  ]);
  check(error, "activities_list");
  check(foldersResult.error, "folders_list");
  const folders = foldersResult.data ?? [];
  const currentFolder = folders.find(entry => entry.id === folder);
  function href(changes: Query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ folder, view, sort, layout, template, q: term, ...changes })) {
      if (typeof value === "string" && value) params.set(key, value);
    }
    return "/activities?" + params.toString();
  }
  const folderLabel = (id: string): string => {
    const entry = folders.find(item => item.id === id);
    return entry ? (entry.parent_id ? folderLabel(entry.parent_id) + " / " : "") + entry.name : "";
  };
  return <div className="dashboard">
    <aside className="sidebar"><strong>Thư viện của tôi</strong>
      <nav aria-label="Thư viện">{views.map(([key, label, Icon]) => <Link aria-current={key === view && !folder ? "page" : undefined} href={href({ view: key, folder: undefined })} key={key}><Icon size={18}/>{label}</Link>)}</nav>
      {folders.length > 0 && <nav aria-label="Thư mục">{folders.map(entry => <Link href={href({ view: "folder", folder: entry.id })} key={entry.id}
        aria-current={folder === entry.id ? "page" : undefined}><Folder size={17} color={entry.color}/>{folderLabel(entry.id)}</Link>)}</nav>}
      <details className="folder-create"><summary><Plus size={17}/> Tạo thư mục</summary><form action={changeFolder.bind(null, null, "save")} className="stack">
        <label>Tên thư mục<input name="name" required maxLength={100}/></label>
        <label>Màu<input name="color" type="color" defaultValue="#7858d9"/></label>
        <label>Thư mục cha<select name="parent" defaultValue={folder ?? ""}><option value="">Thư viện</option>{folders.map(entry => <option key={entry.id} value={entry.id}>{folderLabel(entry.id)}</option>)}</select></label>
        <button className="button">Lưu thư mục</button>
      </form></details>
    </aside>
    <section className="workspace"><div className="section-head"><div><p className="welcome">{profile.display_name ? `Xin chào, ${profile.display_name}` : "Không gian giáo viên"}</p>
      <h1>{currentFolder?.name ?? (view === "all" ? "Hoạt động của tôi" : views.find(([key]) => key === view)?.[1] ?? "Hoạt động của tôi")}</h1>
    </div><Link className="button primary" href="/activities/new"><Plus size={20}/> Tạo hoạt động</Link></div>
    {query.saved && <p className="notice" role="status">Đã lưu thay đổi.</p>}
    {query.invalid && <p className="notice error" role="alert">Kiểm tra thông tin thư mục.</p>}
    {currentFolder && <details className="panel compact"><summary>Quản lý thư mục</summary><form className="inline-actions" action={changeFolder.bind(null, currentFolder.id, "save")}>
      <label>Tên<input name="name" defaultValue={currentFolder.name} required maxLength={100}/></label><label>Màu<input type="color" name="color" defaultValue={currentFolder.color}/></label><button className="button">Lưu</button></form>
      <form action={changeFolder.bind(null, currentFolder.id, "delete")}><ConfirmButton message="Xóa thư mục? Hoạt động và thư mục con sẽ được đưa về thư viện.">Xóa thư mục</ConfirmButton></form></details>}
    <div className="toolbar"><form className="search" action="/activities">
      <input type="hidden" name="view" value={view}/><input type="hidden" name="folder" value={folder ?? ""}/><input type="hidden" name="layout" value={layout}/>
      <label className="search-input"><Search size={18}/><input name="q" aria-label="Tìm hoạt động" placeholder="Tìm hoạt động…" defaultValue={term}/></label>
      <select aria-label="Lọc mẫu" name="template" defaultValue={template ?? ""}><option value="">Tất cả mẫu</option>{Object.entries(templates).map(([id, meta]) => <option key={id} value={id}>{meta.title}</option>)}</select>
      <select aria-label="Sắp xếp" name="sort" defaultValue={sorter}><option value="updated_at">Mới sửa</option><option value="created_at">Mới tạo</option><option value="title">Tên A–Z</option></select>
      <button className="button">Lọc</button></form>
      <div className="view-toggle"><Link aria-label="Dạng lưới" aria-current={layout !== "list" ? "true" : undefined} href={href({ layout: "grid", page: String(page) })}><LayoutGrid size={18}/></Link>
        <Link aria-label="Dạng danh sách" aria-current={layout === "list" ? "true" : undefined} href={href({ layout: "list", page: String(page) })}><List size={18}/></Link></div></div>
    <p className="muted">{count ?? 0} hoạt động</p>
    {data?.length ? <div className={layout === "list" ? "activity-list" : "activity-grid"}>{data.map(activity => {
      const templateId = isTemplate(activity.template) ? activity.template : null;
      const meta = templateId ? templates[templateId] : null;
      return <Link className="template-card" key={activity.id} href={`/activities/${activity.id}`}>
        <span className={`template-picture activity-picture ${meta?.color ?? "violet"}`} aria-hidden="true">
          {templateId && <Image src={`/illustrations/gameplay/${templateId}.webp`} alt="" fill unoptimized loading="lazy"/>}
          {activity.favorite && <Heart size={17}/>}</span>
        <div><strong>{activity.title}</strong><small>{meta?.title} {activity.draft ? "· Bản nháp" : ""}</small></div></Link>;
    })}</div> : <div className="empty"><Library size={35}/><h2>Chưa có hoạt động</h2><p>{term || template ? "Thử từ khóa hoặc bộ lọc khác." : "Hoạt động trong mục này sẽ xuất hiện tại đây."}</p></div>}
    {(page > 1 || (count ?? 0) > page * 12) && <nav className="inline-actions" aria-label="Phân trang">
      {page > 1 && <Link className="button" href={href({ page: String(page - 1) })}>Trang trước</Link>}<span>Trang {page}</span>
      {(count ?? 0) > page * 12 && <Link className="button" href={href({ page: String(page + 1) })}>Trang sau</Link>}</nav>}
    </section></div>;
}
