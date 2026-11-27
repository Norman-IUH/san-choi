import { account, check } from "@/lib/supabase";
import { AssignmentAudience } from "./AssignmentAudience";
import { classroomPages } from "@/lib/classroom-server";

export async function AssignmentForm({ action }: { action: (form: FormData) => Promise<void> }) {
  const { db, user } = await account(true);
  const [classes, roster] = await Promise.all([
    db.from("classrooms").select("id,name").eq("owner_id", user.id).is("archived_at", null).order("name"),
    classroomPages((offset, end) => db.from("classroom_members").select("classroom_id,students!inner(id,name)").eq("owner_id", user.id)
      .is("removed_at", null).is("students.archived_at", null).order("classroom_id").order("student_id").range(offset, end)
      .overrideTypes<{ classroom_id: string; students: { id: string; name: string } }[], { merge: false }>()),
  ]);
  check(classes.error, "assignment_classrooms");
  const classrooms = (classes.data ?? []).map(row => ({ ...row,
    students: roster.filter(entry => entry.classroom_id === row.id).map(entry => entry.students)
      .sort((a, b) => a.name.localeCompare(b.name, "vi")) }));
  return <form action={action} className="stack">
    <AssignmentAudience classrooms={classrooms}/>
    <label>Hạn nộp (giờ Việt Nam)<input name="deadline" type="datetime-local"/></label>
    <label className="check"><input type="checkbox" name="show_score" defaultChecked/> Cho học sinh xem điểm</label>
    <label className="check"><input type="checkbox" name="show_review"/> Cho học sinh xem câu sai và đáp án sau khi nộp</label>
    <button className="button primary">Tạo link giao bài</button>
  </form>;
}
