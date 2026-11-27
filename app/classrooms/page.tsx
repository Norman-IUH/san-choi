import Link from "next/link";
import { z } from "zod";
import { account, check } from "@/lib/supabase";
import { classroomLevels } from "@/lib/classroom";
import { saveClassroom } from "./actions";
import { ClassroomFields } from "./fields";

export default async function Classrooms({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ db, user }, query] = await Promise.all([account(true), searchParams]);
  const level = z.enum(classroomLevels).safeParse(query.level).data;
  let classes = db.from("classrooms").select("id,name,level,schedule,course,archived_at").eq("owner_id", user.id);
  if (query.status === "archived") classes = classes.not("archived_at", "is", null);
  else if (query.status !== "all") classes = classes.is("archived_at", null);
  if (level) classes = classes.eq("level", level);
  const needle = typeof query.q === "string" ? query.q.trim().slice(0, 120) : "";
  const { data, error } = await classes.order(query.sort === "level" ? "level" : "name").order("id");
  check(error, "list_classrooms");
  const rows = data?.filter(row => [row.name, row.course, row.schedule].some(value => value.toLocaleLowerCase("vi").includes(needle.toLocaleLowerCase("vi"))));
  return <div className="narrow wide stack">
    <div className="section-head"><h1>Lớp học</h1><Link className="button" href="/classrooms/students">Hồ sơ học sinh</Link></div>
    {query.problem && <p role="alert" className="notice error">{query.problem}</p>}
    <form className="panel stack">
      <div className="form-grid">
        <label>Tìm lớp<input name="q" defaultValue={needle}/></label>
        <label>Cấp độ<select name="level" defaultValue={level ?? ""}><option value="">Tất cả</option>{classroomLevels.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Trạng thái<select name="status" defaultValue={query.status ?? ""}><option value="">Đang hoạt động</option><option value="archived">Đã lưu trữ</option><option value="all">Tất cả</option></select></label>
        <label>Sắp xếp<select name="sort" defaultValue={query.sort ?? ""}><option value="">Tên lớp</option><option value="level">Cấp độ</option></select></label>
      </div><button className="button">Lọc lớp</button>
    </form>
    <ul className="assignment-list">{rows?.map(row => <li key={row.id}><Link href={`/classrooms/${row.id}`}>{row.name}</Link>
      <span>{[row.level, row.course, row.schedule, row.archived_at && "Đã lưu trữ"].filter(Boolean).join(" · ")}</span></li>)}</ul>
    {!rows?.length && <p>Chưa có lớp phù hợp với bộ lọc.</p>}
    <details className="panel" open={Boolean(query.problem)}><summary>Tạo lớp học</summary>
      <form className="stack" action={saveClassroom.bind(null, null)}><ClassroomFields/><button className="button primary">Lưu lớp học</button></form>
    </details>
  </div>;
}
