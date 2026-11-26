import Link from "next/link";
import { account, check } from "@/lib/supabase";

export default async function Results() {
  const { db } = await account(true);
  const [assignments, complete, count] = await Promise.all([
    db.from("assignments").select("id,title,closed,created_at").order("created_at", { ascending: false }).limit(100),
    db.from("attempts").select("id", { count: "exact", head: true }).not("completed_at", "is", null),
    db.from("assignments").select("id", { count: "exact", head: true }),
  ]);
  check(assignments.error, "results_list"); check(complete.error, "complete_count"); check(count.error, "assignment_count");
  return <div className="page stack"><h1>Kết quả</h1><div className="stats">
    <div className="panel"><strong>{count.count ?? 0}</strong><p>Bài đã giao</p></div>
    <div className="panel"><strong>{complete.count ?? 0}</strong><p>Bài đã nộp</p></div></div>
    <section className="panel stack"><h2>Bài giao gần đây</h2>
      {assignments.data?.length ? <ul className="assignment-list">{assignments.data.map(row => <li key={row.id}><Link href={`/assignments/${row.id}`}>{row.title}</Link><span>{row.closed ? "Đã đóng" : "Đang mở"}</span></li>)}</ul>
        : <p>Chưa có bài giao. <Link href="/activities">Chọn hoạt động để giao bài.</Link></p>}
    </section></div>;
}
