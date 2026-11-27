"use server";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { account, check } from "@/lib/supabase";
import { levels, templateSchema } from "@/lib/game";
import { itemMediaPaths } from "@/lib/media";
import { bankWordSchema, importBankRows, lessonSchema, vocabularyGame, wordItem } from "@/lib/vocabulary-bank";
import { readVocabularyRows } from "@/lib/vocabulary-import";
import { loadWords } from "@/lib/vocabulary-server";

const uuid = z.uuid();
const text = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};
const issue = (path: string, message: string): never =>
  redirect(path + "?" + new URLSearchParams({ problem: message }));

export async function saveBankWord(id: string | null, form: FormData) {
  const { db, user } = await account(true);
  if (id && !uuid.safeParse(id).success) notFound();
  const back = "/library/words/" + (id ?? "new");
  const parsed = bankWordSchema.safeParse({
    ...Object.fromEntries(["word", "meaning", "level", "topic", "part", "ipa", "example", "related"]
      .map(name => [name, text(form, name)])),
    image: text(form, "image") || null, uk: text(form, "uk") || null, us: text(form, "us") || null,
  });
  if (!parsed.success) return issue(back, "Kiểm tra từ, nghĩa, cấp độ và tệp đính kèm.");
  const item = wordItem({ id: id ?? "", ...parsed.data });
  if (itemMediaPaths([item]).some(path => !path.startsWith(user.id + "/"))) return issue(back, "Tệp phải thuộc thư viện của giáo viên.");
  const result = await (id ? db.from("vocabulary_entries").update(parsed.data).eq("id", id).eq("owner_id", user.id)
    : db.from("vocabulary_entries").insert(parsed.data)).select("id").single();
  if (result.error?.code === "23505") return issue(back, "Từ và nghĩa này đã có trong cấp độ đã chọn.");
  check(result.error, "save_bank_word");
  redirect("/library?saved=word");
}

export async function setWordArchived(id: string, archived: boolean) {
  const { db, user } = await account(true);
  if (!uuid.safeParse(id).success || typeof archived !== "boolean") notFound();
  const { data, error } = await db.from("vocabulary_entries").update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id).eq("owner_id", user.id).select("id").maybeSingle();
  check(error, "archive_bank_word");
  if (!data) notFound();
  redirect("/library?saved=word");
}

export async function importBank(form: FormData) {
  const { db } = await account(true);
  const file = form.get("file");
  const defaults = z.object({ level: z.enum(levels), topic: z.string().trim().min(1).max(80) })
    .safeParse({ level: text(form, "level"), topic: text(form, "topic") });
  if (!(file instanceof File) || !defaults.success) return issue("/library", "Chọn tệp và cấp độ, chủ đề mặc định.");
  let rows: ReturnType<typeof importBankRows>;
  try {
    rows = importBankRows(await readVocabularyRows(file), defaults.data);
  } catch (error) {
    const message = error instanceof Error && /^(Cần|Chọn|Tệp|Dòng)/.test(error.message)
      ? error.message : "Chưa đọc được tệp CSV hoặc XLSX.";
    return issue("/library", message);
  }
  const { error } = await db.from("vocabulary_entries").upsert(rows, {
    onConflict: "owner_id,level,word_key,meaning_key", ignoreDuplicates: true,
  });
  check(error, "import_bank");
  redirect("/library?saved=import");
}

export async function updateWordTopics(form: FormData) {
  const { db, user } = await account(true);
  const ids = z.array(uuid).min(1).max(60).safeParse(form.getAll("entry").filter(value => typeof value === "string" && !value.startsWith("catalog/")));
  const metadata = z.object({ level: z.enum(levels), topic: z.string().trim().min(1).max(80) })
    .safeParse({ level: text(form, "level"), topic: text(form, "topic") });
  if (!ids.success || !metadata.success) return issue("/library", "Chọn từ riêng và nhập cấp độ, chủ đề mới.");
  const keys = [...new Set(ids.data)];
  if ((await loadWords(db, user.id, keys)).length !== keys.length) notFound();
  const { data, error } = await db.from("vocabulary_entries").update(metadata.data).eq("owner_id", user.id).in("id", keys).select("id");
  if (error?.code === "23505") return issue("/library", "Cấp độ mới đã có từ và nghĩa trùng nhau.");
  check(error, "bulk_update_words");
  if (!data?.length) notFound();
  redirect("/library?saved=word");
}

export async function saveVocabularyLesson(id: string | null, form: FormData) {
  const { db, user } = await account(true);
  if (id && !uuid.safeParse(id).success) notFound();
  const parsed = lessonSchema.safeParse({
    ...Object.fromEntries(["title", "level", "skill", "topic", "unit", "difficulty"].map(name => [name, text(form, name)])),
    entry_keys: form.getAll("entry"),
  });
  const path = id ? `/library/${id}` : "/library";
  if (!parsed.success || !parsed.data.entry_keys.length) return issue(path, "Nhập thông tin bài học và chọn từ 1 đến 60 từ.");
  const words = await loadWords(db, user.id, parsed.data.entry_keys);
  if (words.length !== parsed.data.entry_keys.length) return issue(path, "Một số từ đã chọn không còn khả dụng.");
  if (words.some(word => word.archived_at)) {
    const { data: previous } = id ? await db.from("vocabulary_lessons").select("entry_keys").eq("id", id).eq("owner_id", user.id).maybeSingle() : { data: null };
    if (words.some(word => word.archived_at && !previous?.entry_keys.includes(word.id))) return issue(path, "Hãy khôi phục từ đã lưu trữ trước khi thêm vào bài mới.");
  }
  const { data, error } = await (id ? db.from("vocabulary_lessons").update(parsed.data).eq("owner_id", user.id).eq("id", id)
    : db.from("vocabulary_lessons").insert(parsed.data)).select("id").single();
  check(error, "save_vocabulary_lesson");
  redirect(`/library/${data!.id}`);
}

export async function createLessonGame(id: string, form: FormData) {
  const { db, user } = await account(true);
  const template = templateSchema.safeParse(form.get("template"));
  if (!uuid.safeParse(id).success || !template.success) notFound();
  const { data, error } = await db.from("vocabulary_lessons").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle();
  check(error, "lesson_game_source");
  if (!data) notFound();
  const lesson = lessonSchema.parse(data);
  const words = await loadWords(db, user.id, lesson.entry_keys);
  const content = words.length === lesson.entry_keys.length && vocabularyGame(template.data, words, lesson.skill, lesson.difficulty);
  if (!content) return issue(`/library/${id}`, "Bài học chưa có đủ cấu trúc cho mẫu này.");
  const { data: activity, error: insertError } = await db.from("activities").insert({
    title: lesson.title, subject: "English", grade: lesson.level, tags: lesson.topic, template: template.data,
    vocabulary_lesson_id: id, content, draft: true,
  }).select("id").single();
  check(insertError, "create_vocabulary_activity");
  redirect(`/activities/${activity!.id}?edit=1`);
}
