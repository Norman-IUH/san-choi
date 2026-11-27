import "server-only";
import { notFound } from "next/navigation";
import { account, check } from "./supabase";
import { summarizeProgress, type ProgressAssignment, type ProgressAttempt, type ProgressFilters, type ProgressRecipient } from "./classroom-progress";
import type { Classroom, Student } from "./classroom";

const pageSize = 250;
export async function classroomPages<T>(get: (offset: number, end: number) => PromiseLike<{ data: T[] | null; error: { code?: string } | null }>) {
  const rows: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await get(offset, offset + pageSize - 1);
    check(error, "classroom_query");
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return rows;
  }
}

export async function classroomData(filters: ProgressFilters) {
  const { db, user } = await account(true);
  if (!filters.classroom && !filters.student) notFound();
  const [room, learner, memberships, scopedAssignment] = await Promise.all([
    filters.classroom ? db.from("classrooms").select("id,name,level,schedule,course,notes,archived_at")
      .eq("owner_id", user.id).eq("id", filters.classroom).maybeSingle() : null,
    filters.student ? db.from("students").select("id,name,notes,archived_at")
      .eq("owner_id", user.id).eq("id", filters.student).maybeSingle() : null,
    filters.classroom ? classroomPages((offset, end) => {
      return db.from("classroom_members").select("student_id,removed_at,students(id,name,notes,archived_at)")
        .eq("owner_id", user.id).eq("classroom_id", filters.classroom!).order("student_id").range(offset, end)
        .overrideTypes<{ student_id: string; removed_at: string | null; students: Student | null }[], { merge: false }>();
    }) : [],
    filters.assignment && filters.classroom ? db.from("assignments").select("id").eq("id", filters.assignment)
      .eq("owner_id", user.id).eq("classroom_id", filters.classroom).maybeSingle() : null,
  ]);
  check(room?.error ?? null, "get_classroom");
  check(learner?.error ?? null, "get_student");
  check(scopedAssignment?.error ?? null, "check_assignment_scope");
  if ((filters.classroom && !room?.data) || (filters.student && !learner?.data) ||
    (filters.classroom && filters.student && !memberships.some(member => member.student_id === filters.student)) ||
    (filters.assignment && !scopedAssignment?.data)) notFound();
  const classroom = room?.data as Classroom | undefined;
  const student = learner?.data as Student | undefined;
  const recipients = await classroomPages((offset, end) => {
    let query = db.from("assignment_students").select("assignment_id,student_id,assignments!inner(classroom_id,created_at)")
      .eq("owner_id", user.id);
    if (filters.classroom) query = query.eq("assignments.classroom_id", filters.classroom);
    if (filters.student) query = query.eq("student_id", filters.student);
    if (filters.assignment) query = query.eq("assignment_id", filters.assignment);
    if (filters.from) query = query.gte("assignments.created_at", `${filters.from}T00:00:00+07:00`);
    if (filters.to) query = query.lt("assignments.created_at", new Date(Date.parse(`${filters.to}T00:00:00+07:00`) + 86400000).toISOString());
    return query.order("assignment_id").order("student_id").range(offset, end);
  });
  const assigned = [...new Set(recipients.map(row => row.assignment_id))];
  const assignmentFields = "id,classroom_id,title,content,assessment,created_at,deadline,closed,attempt_cap,classrooms(name)";
  const sources: ProgressAssignment[] = classroom && !filters.student ? await classroomPages((offset, end) => {
    let query = db.from("assignments").select(assignmentFields).eq("owner_id", user.id).eq("classroom_id", classroom.id);
    if (filters.assignment) query = query.eq("id", filters.assignment);
    if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00+07:00`);
    if (filters.to) query = query.lt("created_at", new Date(Date.parse(`${filters.to}T00:00:00+07:00`) + 86400000).toISOString());
    return query.order("created_at", { ascending: false }).order("id").range(offset, end)
      .overrideTypes<ProgressAssignment[], { merge: false }>();
  }) : [];
  const attempts: ProgressAttempt[] = [];
  for (let i = 0; i < assigned.length; i += 75) {
    const ids = assigned.slice(i, i + 75);
    const [source, history] = await Promise.all([
      filters.student ? db.from("assignments").select(assignmentFields)
        .eq("owner_id", user.id).in("id", ids).overrideTypes<ProgressAssignment[], { merge: false }>() : null,
      classroomPages((offset, end) => {
        let query = db.from("attempts").select("id,assignment_id,student_id,started_at,completed_at,score,total,answers,manual_reviews(state,total)")
          .in("assignment_id", ids).not("student_id", "is", null);
        if (filters.student) query = query.eq("student_id", filters.student);
        return query.order("id").range(offset, end).overrideTypes<ProgressAttempt[], { merge: false }>();
      }),
    ]);
    check(source?.error ?? null, "classroom_assignments");
    sources.push(...source?.data ?? []);
    attempts.push(...history);
  }
  const students = new Map<string, Student>();
  if (student) students.set(student.id, student);
  for (const member of memberships) if (member.students) students.set(member.student_id, member.students);
  const roster = memberships.filter(member => !member.removed_at && member.students && (!filters.student || member.student_id === filters.student))
    .map(member => member.students!).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  return { classroom, student, roster, students, asOf: Date.now(),
    progress: summarizeProgress(sources, recipients as ProgressRecipient[], attempts, filters.skill) };
}
