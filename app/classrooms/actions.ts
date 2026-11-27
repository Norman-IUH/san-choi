"use server";

import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { account, check, privilegedDatabase } from "@/lib/supabase";
import { classroomSchema, rosterNames, studentSchema } from "@/lib/classroom";
import { readVocabularyRows } from "@/lib/vocabulary-import";
import { newStudentCode, studentCodeHash } from "@/lib/student-code";

const valid = (id: unknown) => z.uuid().safeParse(id).success;
const issue = (path: string, problem: string): never => redirect(path + "?" + new URLSearchParams({ problem }));
const getText = (form: FormData, key: string) => String(form.get(key) ?? "");

export async function saveClassroom(id: string | null, form: FormData) {
  const { db, user } = await account(true);
  if (id && !valid(id)) notFound();
  const parsed = classroomSchema.safeParse(Object.fromEntries(["name", "level", "schedule", "course", "notes"].map(key => [key, getText(form, key)])));
  if (!parsed.success) return issue(id ? `/classrooms/${id}` : "/classrooms", "Kiểm tra tên, cấp độ và độ dài các trường.");
  const { data, error } = await (id
    ? db.from("classrooms").update(parsed.data).eq("owner_id", user.id).eq("id", id)
    : db.from("classrooms").insert({ owner_id: user.id, ...parsed.data })).select("id").maybeSingle();
  check(error, "save_classroom");
  if (!data) notFound();
  redirect(`/classrooms/${data.id}`);
}

export async function archiveClassroom(id: string, archive: boolean) {
  const { db, user } = await account(true);
  if (!valid(id)) notFound();
  const { data, error } = await db.from("classrooms").update({ archived_at: archive ? new Date().toISOString() : null })
    .eq("owner_id", user.id).eq("id", id).select("id").maybeSingle();
  check(error, "archive_classroom");
  if (!data) notFound();
  redirect(`/classrooms/${id}`);
}

export async function duplicateClassroom(id: string, form: FormData) {
  const { db } = await account(true);
  if (!valid(id)) notFound();
  const { data, error } = await db.rpc("clone_classroom", { p_class: id, p_roster: form.has("roster") });
  check(error, "duplicate_classroom");
  redirect(`/classrooms/${data}`);
}

export async function importRoster(id: string, form: FormData) {
  const { db, user } = await account(true);
  if (!valid(id)) notFound();
  const { data, error } = await db.from("classrooms").select("id").eq("owner_id", user.id).eq("id", id).is("archived_at", null).maybeSingle();
  check(error, "import_classroom");
  if (!data) notFound();
  const path = `/classrooms/${id}`;
  const file = form.get("file");
  let names: string[];
  try {
    names = file instanceof File && file.size ? rosterNames(await readVocabularyRows(file)) : rosterNames([["name"], [getText(form, "name")]]);
  } catch (failure) {
    const message = failure instanceof Error && /^(Dòng|Nhập|Kiểm tra|Tệp|Chọn)/.test(failure.message) ? failure.message : "Chưa đọc được danh sách.";
    return issue(path, message);
  }
  const result = await db.rpc("import_classroom_students", { p_class: id, p_names: names });
  check(result.error, "import_roster");
  redirect(`${path}?added=${names.length}`);
}

export async function saveStudent(id: string, form: FormData) {
  const { db, user } = await account(true);
  if (!valid(id)) notFound();
  const path = `/classrooms/students/${id}`;
  const parsed = studentSchema.safeParse({ name: getText(form, "name"), notes: getText(form, "notes") });
  if (!parsed.success) return issue(path, "Kiểm tra tên và ghi chú.");
  const { data, error } = await db.from("students").update(parsed.data).eq("owner_id", user.id).eq("id", id).select("id").maybeSingle();
  check(error, "update_student");
  if (!data) notFound();
  redirect(path);
}

export async function moveStudent(id: string, from: string | null, form: FormData) {
  const { db } = await account(true);
  const to = form.get("classroom");
  if (!valid(id) || (from !== null && !valid(from))) notFound();
  const path = `/classrooms/students/${id}`;
  if (!valid(to) || from === to) return issue(path, "Chọn lớp đích khác lớp hiện tại.");
  const { error } = await db.rpc("move_classroom_student", { p_student: id, p_from: from, p_to: to });
  if (error) return issue(path, "Chưa đổi được lớp. Kiểm tra các lớp đang hoạt động.");
  redirect(path);
}

export async function removeMembership(id: string, classroom: string) {
  const { db, user } = await account(true);
  if (!valid(id) || !valid(classroom)) notFound();
  const { error } = await db.from("classroom_members").update({ removed_at: new Date().toISOString() })
    .eq("owner_id", user.id).eq("student_id", id).eq("classroom_id", classroom).is("removed_at", null);
  check(error, "remove_membership");
  redirect(`/classrooms/students/${id}`);
}

export async function archiveStudent(id: string, archive: boolean) {
  const { user } = await account(true);
  if (!valid(id)) notFound();
  const { data, error } = await privilegedDatabase().from("students")
    .update({ archived_at: archive ? new Date().toISOString() : null, code_hash: null, code_version: crypto.randomUUID() })
    .eq("owner_id", user.id).eq("id", id).select("id").maybeSingle();
  check(error, "archive_student");
  if (!data) notFound();
  redirect(`/classrooms/students/${id}`);
}

export async function manageStudentCode(id: string, _state: { message: string; code?: string }, form: FormData) {
  const { user } = await account(true);
  if (!valid(id)) notFound();
  const intent = form.get("intent");
  if (intent !== "issue" && intent !== "revoke") return { message: "Chọn thao tác với mã." };
  const code = intent === "issue" ? newStudentCode() : undefined;
  const { data, error } = await privilegedDatabase().from("students")
    .update({ code_hash: code ? studentCodeHash(code) : null, code_version: crypto.randomUUID() })
    .eq("owner_id", user.id).eq("id", id).is("archived_at", null).select("id").maybeSingle();
  check(error, "manage_student_code");
  if (!data) notFound();
  return { code, message: code ? "Mã chỉ xuất hiện lúc này. Gửi riêng cho học sinh." : "Đã thu hồi mã." };
}

export async function deleteStudent(id: string, form: FormData) {
  const { user } = await account(true);
  if (!valid(id)) notFound();
  if (form.get("confirm") !== "XÓA") return issue(`/classrooms/students/${id}`, "Nhập XÓA để xác nhận.");
  const { data, error } = await privilegedDatabase().from("students").delete().eq("owner_id", user.id).eq("id", id)
    .not("archived_at", "is", null).select("id").maybeSingle();
  check(error, "delete_student");
  if (!data) notFound();
  redirect("/classrooms");
}
