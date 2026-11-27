import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { account, check } from "@/lib/supabase";
import type { Classroom, Student } from "@/lib/classroom";
import { ClassroomFields } from "../fields";
import { archiveClassroom, duplicateClassroom, importRoster, saveClassroom } from "../actions";

export default async function ClassroomPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ id }, query, { db, user }] = await Promise.all([params, searchParams, account(true)]);
  if (!z.uuid().safeParse(id).success) notFound();
  const [classroom, membership] = await Promise.all([
    db.from("classrooms").select("id,name,level,schedule,course,notes,archived_at").eq("owner_id", user.id).eq("id", id).maybeSingle(),
    db.from("classroom_members").select("students(id,name,notes,archived_at)").eq("owner_id", user.id).eq("classroom_id", id)
      .is("removed_at", null).overrideTypes<{ students: Student | null }[], { merge: false }>(),
  ]);
  check(classroom.error, "classroom_detail"); check(membership.error, "classroom_roster");
  if (!classroom.data) notFound();
  const row = classroom.data as Classroom;
  const needle = typeof query.q === "string" ? query.q.trim().slice(0, 80).toLocaleLowerCase("vi") : "";
  const roster = (membership.data ?? []).flatMap(member => member.students ? [member.students] : []);
  const students = roster.filter(student => (!student.archived_at || query.archived === "1") &&
    student.name.toLocaleLowerCase("vi").includes(needle)).sort((a, b) => a.name.localeCompare(b.name, "vi") * (query.sort === "desc" ? -1 : 1));
  return <div className="narrow wide stack">
    <Link className="back" href="/classrooms">← Lớp học</Link><h1>{row.name}</h1>
    <p>{[row.level, row.course, row.schedule, row.archived_at && "Đã lưu trữ"].filter(Boolean).join(" · ")}</p>
    {query.problem && <p role="alert" className="notice error">{query.problem}</p>}
    {query.added && <p role="status" className="notice">Đã thêm {query.added} học sinh.</p>}
    <section className="panel stack"><h2>Học sinh</h2>
      <form className="stack"><div className="form-grid">
        <label>Tìm học sinh<input name="q" defaultValue={query.q}/></label>
        <label>Sắp xếp<select name="sort" defaultValue={query.sort ?? ""}><option value="">Tên A–Z</option><option value="desc">Tên Z–A</option></select></label>
        <label className="check"><input name="archived" value="1" type="checkbox" defaultChecked={query.archived === "1"}/> Hiện hồ sơ đã lưu trữ</label>
      </div><button className="button">Lọc danh sách</button></form>
      {students.length ? <ul className="assignment-list">{students.map(student => <li key={student.id}>
        <Link href={`/classrooms/students/${student.id}`}>{student.name} · {student.id.slice(0, 8)}</Link>{student.archived_at && <span>Đã lưu trữ</span>}</li>)}</ul>
        : <p>Chưa có học sinh phù hợp với bộ lọc.</p>}
      {!row.archived_at && <details><summary>Thêm học sinh</summary>
        <form className="stack" action={importRoster.bind(null, id)}><label>Tên học sinh<input name="name" required maxLength={80}/></label>
          <button className="button">Thêm vào lớp</button></form>
        <form className="stack" action={importRoster.bind(null, id)}><label>Danh sách CSV/XLSX<input type="file" name="file" accept=".csv,.xlsx" required/></label>
          <p>Mỗi dòng tạo một hồ sơ riêng. Dòng đầu dùng cột <code>name</code> hoặc <code>Họ tên</code>.</p>
          <button className="button">Nhập danh sách</button></form>
      </details>}
    </section>
    <details className="panel"><summary>Chỉnh sửa lớp</summary>
      <form className="stack" action={saveClassroom.bind(null, id)}><ClassroomFields record={row}/><button className="button primary">Lưu thông tin lớp</button></form>
    </details>
    <div className="inline-actions">
      <form className="inline-actions" action={duplicateClassroom.bind(null, id)}>
        <label className="check"><input name="roster" type="checkbox"/> Giữ danh sách học sinh</label><button className="button">Nhân bản lớp</button>
      </form>
      <form action={archiveClassroom.bind(null, id, !row.archived_at)}><button className="button">{row.archived_at ? "Khôi phục lớp" : "Lưu trữ lớp"}</button></form>
    </div>
  </div>;
}
