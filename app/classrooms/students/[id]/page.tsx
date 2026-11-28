import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { account, check, privilegedDatabase } from "@/lib/supabase";
import { classroomData } from "@/lib/classroom-server";
import { readProgressFilters } from "@/lib/classroom-progress";
import { archiveStudent, deleteStudent, moveStudent, removeMembership, saveStudent } from "../../actions";
import { StudentCodeForm } from "./student-code-form";
import { ProgressSummary, ReportControls } from "../../progress";

export default async function StudentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ id }, query, { db, user }] = await Promise.all([params, searchParams, account(true)]);
  if (!z.uuid().safeParse(id).success) notFound();
  const parsed = readProgressFilters({ student: id, skill: query.skill, from: query.from, to: query.to });
  const filters = parsed.data ?? { student: id };
  const [data, list, member] = await Promise.all([
    classroomData(filters),
    db.from("classrooms").select("id,name,archived_at").eq("owner_id", user.id).order("name"),
    db.from("classroom_members").select("classroom_id").eq("owner_id", user.id).eq("student_id", id).is("removed_at", null),
  ]);
  check(list.error, "student_classes"); check(member.error, "student_memberships");
  const row = data.student!;
  const live = await privilegedDatabase().from("live_players")
    .select("id,live_rooms!inner(id,title,created_at,owner_id),live_answers(correct)")
    .eq("student_id",id).eq("live_rooms.owner_id",user.id).limit(50)
    .overrideTypes<{id:string;live_rooms:{id:string;title:string;created_at:string};live_answers:{correct:boolean}[]}[],{merge:false}>();
  check(live.error,"student_live_history");
  const memberships = new Set(member.data?.map(entry => entry.classroom_id));
  const options = list.data?.filter(entry => !entry.archived_at && !memberships.has(entry.id)) ?? [];
  const current = list.data?.filter(entry => memberships.has(entry.id)) ?? [];
  return <div className="narrow wide stack">
    <Link className="back" href="/classrooms">← Lớp học</Link>
    <header><h1>{row.name}</h1><p>Hồ sơ {id.slice(0, 8)} {row.archived_at && "· Đã lưu trữ"}</p></header>
    {query.problem && <p role="alert" className="notice error">{query.problem}</p>}
    {!parsed.success && <p role="alert" className="notice error">Kiểm tra lại bộ lọc ngày giao và kỹ năng.</p>}
    {row.notes && <aside className="panel"><h2>Nhận xét riêng</h2><p className="assessment-response">{row.notes}</p></aside>}
    <ReportControls filters={filters}/>
    <ProgressSummary data={data} individual/>
    <section className="panel stack"><h2>Lượt chơi trực tiếp</h2>
      {live.data?.length ? <ul className="assignment-list">{live.data
        .sort((a,b)=>b.live_rooms.created_at.localeCompare(a.live_rooms.created_at))
        .map(room=><li key={room.id}><Link href={`/live/host/${room.live_rooms.id}`}>{room.live_rooms.title}</Link>
          <span>{room.live_answers.filter(answer=>answer.correct).length}/{room.live_answers.length} câu đã trả lời đúng</span></li>)}</ul>
        : <p>Chưa tham gia phòng trực tiếp theo lớp.</p>}
    </section>
    <details className="panel"><summary>Chỉnh sửa hồ sơ</summary><form action={saveStudent.bind(null, id)} className="stack">
      <label>Tên học sinh<input name="name" required maxLength={80} defaultValue={row.name}/></label>
      <label>Nhận xét riêng<textarea name="notes" maxLength={2000} rows={4} defaultValue={row.notes}/></label>
      <button className="button">Lưu hồ sơ</button>
    </form></details>
    <section className="panel stack"><h2>Lớp đang tham gia</h2>
      {!current.length && <p>Chưa tham gia lớp.</p>}
      <ul className="assignment-list">{current.map(entry => <li key={entry.id}><Link href={`/classrooms/${entry.id}`}>{entry.name}</Link>
        <form action={removeMembership.bind(null, id, entry.id)}><button className="button">Rời lớp</button></form>
      </li>)}</ul>
      {!row.archived_at && options.length > 0 && <>
        <form className="inline-actions" action={moveStudent.bind(null, id, null)}>
          <label>Lớp bổ sung<select name="classroom">{options.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
          <button className="button">Thêm lớp</button>
        </form>
        {current.map(entry => <form key={entry.id} className="inline-actions" action={moveStudent.bind(null, id, entry.id)}>
          <label>Chuyển từ {entry.name}<select name="classroom">{options.map(target => <option key={target.id} value={target.id}>{target.name}</option>)}</select></label>
          <button className="button">Chuyển lớp</button>
        </form>)}
      </>}
    </section>
    {!row.archived_at && <section className="panel stack"><h2>Mã tham gia cá nhân</h2><StudentCodeForm id={id}/></section>}
    <form action={archiveStudent.bind(null, id, !row.archived_at)}><button className="button">{row.archived_at ? "Khôi phục hồ sơ" : "Lưu trữ hồ sơ"}</button></form>
    {row.archived_at && <details className="panel"><summary>Xóa hồ sơ vĩnh viễn</summary>
      <form className="stack" action={deleteStudent.bind(null, id)}>
        <p>Thao tác xóa hồ sơ và các dữ liệu gắn với học sinh.</p>
        <label>Nhập XÓA để xác nhận<input name="confirm" required autoComplete="off"/></label>
        <button className="button danger">Xóa hồ sơ</button>
      </form>
    </details>}
  </div>;
}
