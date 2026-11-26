import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Editor } from "@/components/Editor";
import { Player } from "@/components/Player";
import { changeActivity, createAssignment } from "../actions";
import { compatible, contentSchema, isTemplate, templateIds, templates, type Template } from "@/lib/game";
import { localPlay } from "@/lib/local-play";
import { account, check, urlFor } from "@/lib/supabase";
import { mediaUrls } from "@/lib/media-server";

export default async function Activity({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ id }, query, { db }] = await Promise.all([params, searchParams, account(true)]);
  if (!z.uuid().safeParse(id).success) notFound();
  const [{ data: activity, error }, folders, versions] = await Promise.all([
    db.from("activities").select("*").eq("id", id).maybeSingle(), db.from("folders").select("id,name").order("name"),
    db.from("activity_versions").select("id,created_at,snapshot->>title").eq("activity_id", id).order("id", { ascending: false }).limit(20),
  ]);
  check(error, "activity_detail");
  check(folders.error, "activity_folders");
  check(versions.error, "activity_versions");
  if (!activity || !isTemplate(activity.template)) notFound();
  const template: Template = activity.template;
  const parsed = contentSchema(template, activity.draft).safeParse(activity.content);
  if (!parsed.success) throw new Error("Nội dung lưu không hợp lệ");
  const content = parsed.data;
  const assets = activity.deleted_at ? {} : await mediaUrls(content, activity.owner_id);
  const preview = query.preview && isTemplate(query.preview) && compatible(template, query.preview, content) ? query.preview : null;
  return <div className="narrow wide"><Link className="back" href={activity.deleted_at ? "/activities?view=trash" : "/activities"}>← Hoạt động của tôi</Link>
    <div className="section-head"><div><p className="welcome">{templates[template].title} {activity.draft ? "· Bản nháp" : ""}</p><h1>{activity.title}</h1></div>
      {!activity.deleted_at && !query.edit && <Link className="button primary" href={`/activities/${id}?edit=1`}>Chỉnh sửa</Link>}</div>
    {query.saved && <p className="notice" role="status">Đã lưu thay đổi.</p>}
    {(query.invalid || query.incompatible) && <p className="notice error" role="alert">{query.incompatible ? "Mẫu đích không thể giữ toàn bộ nội dung." : "Kiểm tra thông tin trước khi lưu."}</p>}
    {activity.deleted_at ? <div className="inline-actions">
      <form action={changeActivity.bind(null, id, "restore")}><button className="button primary">Khôi phục</button></form>
      <form action={changeActivity.bind(null, id, "purge")}><ConfirmButton message="Xóa vĩnh viễn hoạt động này?">Xóa vĩnh viễn</ConfirmButton></form></div>
    : query.edit ? <Editor key={activity.updated_at} id={id} template={template} initial={{ title: activity.title, description: activity.description,
      subject: activity.subject, grade: activity.grade, tags: activity.tags, visibility: activity.visibility }} content={content} assets={assets}/>
    : <div className="stack">
      {contentSchema(template).safeParse(content).success && <Player key={preview ?? template} title={activity.title} {...localPlay(preview ?? template, content, assets)}/>}
      {preview && <form action={changeActivity.bind(null, id, "switch")}><input type="hidden" name="template" value={preview}/><button className="button primary">Lưu bản sao dùng mẫu {templates[preview].title}</button></form>}
      <section className="panel stack"><h2>Quản lý hoạt động</h2>
        <div className="inline-actions">
          <form action={changeActivity.bind(null, id, "copy")}><button className="button">Sao chép</button></form>
          <form action={changeActivity.bind(null, id, "favorite")}><button className="button">{activity.favorite ? "Bỏ yêu thích" : "Yêu thích"}</button></form>
          <form action={changeActivity.bind(null, id, "trash")}><ConfirmButton message="Chuyển hoạt động vào thùng rác?">Chuyển vào thùng rác</ConfirmButton></form>
        </div>
        <form className="inline-actions" action={changeActivity.bind(null, id, "move")}><label>Thư mục<select name="folder" defaultValue={activity.folder_id ?? ""}>
          <option value="">Thư viện</option>{folders.data?.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label><button className="button">Di chuyển</button></form>
        <form className="inline-actions" action={changeActivity.bind(null, id, "rename")}><label>Tên mới<input name="name" defaultValue={activity.title} maxLength={120} required/></label><button className="button">Đổi tên</button></form>
      </section>
      <section className="panel stack"><h2>Lịch sử phiên bản</h2>
        <form className="inline-actions" action={changeActivity.bind(null, id, "restore-version")}>
          <label>Phiên bản<select name="version">{versions.data?.map(version => <option key={version.id} value={version.id}>
            {version.title} · {new Date(version.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
          </option>)}</select></label>
          <ConfirmButton message="Khôi phục nội dung phiên bản này dưới dạng bản nháp?">Khôi phục bản nháp</ConfirmButton>
        </form>
      </section>
      <section className="panel stack"><h2>Đổi mẫu</h2>
        <form className="inline-actions"><label>Mẫu đích<select name="preview">{templateIds.filter(id => id !== template).map(id =>
          <option key={id} value={id} disabled={!compatible(template, id, content)}>{templates[id].title}{!compatible(template, id, content) ? " · nội dung khác cấu trúc" : ""}</option>)}</select></label>
        <button className="button" disabled={!templateIds.some(id => id !== template && compatible(template, id, content))}>Xem trước mẫu</button></form>
      </section>
      {!activity.draft && activity.visibility !== "private" && <section className="panel stack"><h2>Chia sẻ</h2><label>Link hoạt động<input readOnly value={urlFor(`/resource/${id}`)}/></label></section>}
      {!activity.draft && <section className="panel stack"><h2>Giao bài</h2><form action={createAssignment.bind(null, id)} className="stack">
        <label>Hạn nộp (giờ Việt Nam)<input name="deadline" type="datetime-local"/></label>
        <label className="check"><input type="checkbox" name="require_name" defaultChecked/> Yêu cầu biệt danh</label>
        <label className="check"><input type="checkbox" name="show_score" defaultChecked/> Cho học sinh xem điểm</label>
        <button className="button primary">Tạo link giao bài</button>
      </form></section>}
    </div>}
  </div>;
}
