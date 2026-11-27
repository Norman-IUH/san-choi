import Link from "next/link";
import { account } from "@/lib/supabase";
import { classroomPages } from "@/lib/classroom-server";

export default async function Students({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ db, user }, query] = await Promise.all([account(true), searchParams]);
  const needle = typeof query.q === "string" ? query.q.trim().slice(0, 80) : "";
  const students = await classroomPages((offset, end) => {
    let records = db.from("students").select("id,name,archived_at").eq("owner_id", user.id);
    if (query.status === "archived") records = records.not("archived_at", "is", null);
    else if (query.status !== "all") records = records.is("archived_at", null);
    return records.order("name", { ascending: query.sort !== "desc" }).order("id").range(offset, end);
  });
  const rows = students.filter(row => row.name.toLocaleLowerCase("vi").includes(needle.toLocaleLowerCase("vi")));
  return <div className="narrow wide stack"><Link className="back" href="/classrooms">← Lớp học</Link>
    <h1>Hồ sơ học sinh</h1><form className="panel stack">
      <div className="form-grid">
        <label>Tìm theo tên<input name="q" defaultValue={needle}/></label>
        <label>Trạng thái<select name="status" defaultValue={query.status ?? ""}>
          <option value="">Đang hoạt động</option><option value="archived">Đã lưu trữ</option><option value="all">Tất cả</option></select></label>
        <label>Sắp xếp<select name="sort" defaultValue={query.sort ?? ""}><option value="">Tên A–Z</option>
          <option value="desc">Tên Z–A</option></select></label>
      </div><button className="button">Lọc hồ sơ</button>
    </form>
    {rows.length ? <ul className="assignment-list">{rows.map(student => <li key={student.id}><Link href={`/classrooms/students/${student.id}`}>
      {student.name} · {student.id.slice(0, 8)}</Link>{student.archived_at && <span>Đã lưu trữ</span>}</li>)}</ul> : <p>Chưa có hồ sơ phù hợp.</p>}
  </div>;
}
