"use server";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { account, check, privilegedDatabase } from "@/lib/supabase";
import { compatible, contentSchema, templateSchema, type Item } from "@/lib/game";
import { demoContent, demos } from "@/lib/demo";
import { itemMediaPaths } from "@/lib/media";
import { englishDeckContent, englishDecks, isDeckId } from "@/lib/english-samples";

const uuid = z.uuid();

export async function importEnglishDeck(form: FormData) {
  const { db } = await account(true);
  const level = form.get("level");
  const template = form.get("template");
  if (typeof level !== "string" || !isDeckId(level) || (template !== "match-up" && template !== "flash-cards")) notFound();
  const deck = englishDecks[level];
  const { data, error } = await db.from("activities").insert({
    title: deck.title, subject: "English", grade: deck.level, tags: "Vocabulary", template, content: englishDeckContent(level),
  }).select("id").single();
  check(error, "import_english_deck");
  redirect(`/activities/${data!.id}?edit=1&saved=1`);
}

export async function importDemo(form: FormData) {
  const { db } = await account(true);
  const template = templateSchema.safeParse(form.get("template"));
  if (!template.success) redirect("/activities/new");
  const demo = demos.find(item => item.id === template.data)!;
  const { data, error } = await db.from("activities").insert({
    title: demo.demoTitle, template: demo.id, content: demoContent(demo.id),
  }).select("id").single();
  check(error, "import_demo");
  redirect(`/activities/${data!.id}?edit=1&saved=1`);
}
const activitySchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000),
  subject: z.string().trim().max(80),
  grade: z.string().trim().max(40),
  tags: z.string().trim().max(250),
  visibility: z.enum(["private", "public", "unlisted"]),
  template: templateSchema,
  draft: z.boolean(),
  content: z.unknown(),
});

export async function saveActivity(id: string | null, value: unknown) {
  const { db, user } = await account(true);
  const parsed = activitySchema.safeParse(value);
  if (!parsed.success || (id && !uuid.safeParse(id).success)) return { error: "Kiểm tra tên và thông tin hoạt động." };
  const fields = parsed.data;
  const content = contentSchema(fields.template, fields.draft).safeParse(fields.content);
  if (!content.success) return { error: content.error.issues[0].message };
  if (itemMediaPaths(content.data).some(path => !path.startsWith(user.id + "/"))) return { error: "Tệp phải thuộc thư viện của giáo viên." };
  const row = { ...fields, content: content.data, updated_at: new Date().toISOString() };
  const operation = id ? db.from("activities").update(row).eq("id", id).is("deleted_at", null) : db.from("activities").insert(row);
  const { data, error } = await operation.select("id").single();
  check(error, "save_activity");
  redirect(`/activities/${data!.id}?saved=1`);
}

export async function changeActivity(id: string, command: string, form: FormData) {
  if (!uuid.safeParse(id).success) notFound();
  const { db } = await account(true);
  const { data: row, error } = await db.from("activities").select("*").eq("id", id).maybeSingle();
  check(error, "load_activity");
  if (!row) notFound();
  const updated_at = new Date().toISOString();
  if (command === "copy" || command === "switch") {
    const source = templateSchema.parse(row.template);
    const parsedTarget = templateSchema.safeParse(command === "copy" ? source : form.get("template"));
    if (!parsedTarget.success) redirect("/activities/" + id + "?incompatible=1");
    const target = parsedTarget.data;
    if (command === "switch" && !compatible(source, target, row.content as Item[])) redirect(`/activities/${id}?incompatible=1`);
    const { data, error: insertError } = await db.from("activities").insert({
      title: (row.title.slice(0, 109) + " (bản sao)"), template: target, content: row.content,
      description: row.description, tags: row.tags, grade: row.grade, subject: row.subject, folder_id: row.folder_id,
    }).select("id").single();
    check(insertError, "copy_activity");
    redirect(`/activities/${data!.id}?saved=1`);
  }

  if (command === "restore-version") {
    const versionId = form.get("version");
    if (typeof versionId !== "string" || !/^\d{1,18}$/.test(versionId) || row.deleted_at) notFound();
    const { data: version, error: versionError } = await db.from("activity_versions").select("snapshot")
      .eq("activity_id", id).eq("id", versionId).maybeSingle();
    check(versionError, "load_activity_version");
    if (!version) notFound();
    const fields = activitySchema.parse({ ...version.snapshot, visibility: row.visibility, draft: true });
    const content = contentSchema(fields.template, true).parse(fields.content);
    const { error: updateError } = await db.from("activities").update({ ...fields, content, updated_at })
      .eq("id", id).is("deleted_at", null).select("id").single();
    check(updateError, "restore_activity_version");
    redirect("/activities/" + id + "?saved=1");
  }

  if (command === "purge") {
    const result = await db.from("activities").delete().eq("id", id).not("deleted_at", "is", null).select("id").single();
    check(result.error, "purge_activity");
  } else {
    const folder = form.get("folder");
    const name = z.string().trim().min(1).max(120).safeParse(form.get("name"));
    const changes = command === "trash" ? { deleted_at: updated_at }
      : command === "restore" ? { deleted_at: null }
      : command === "favorite" ? { favorite: !row.favorite }
      : command === "move" ? { folder_id: folder ? uuid.parse(folder) : null }
      : command === "rename" && name.success ? { title: name.data }
      : null;
    if (!changes) redirect(`/activities/${id}?invalid=1`);
    const result = await db.from("activities").update({ ...changes, updated_at }).eq("id", id).select("id").single();
    check(result.error, "update_activity");
  }
  redirect(command === "trash" || command === "purge" ? "/activities?view=trash&saved=1" : `/activities/${id}?saved=1`);
}

export async function changeFolder(id: string | null, command: string, form: FormData) {
  const { db } = await account(true);
  const name = z.string().trim().min(1).max(100);
  if (id && !uuid.safeParse(id).success) notFound();
  if (command === "delete" && id) {
    const { error } = await db.from("folders").delete().eq("id", id).select("id").single();
    check(error, "delete_folder");
    redirect("/activities?saved=1");
  }
  const parent = form.get("parent");
  const parsedName = name.safeParse(form.get("name"));
  const parsedParent = z.union([uuid, z.literal(""), z.null()]).safeParse(parent);
  const color = z.string().regex(/^#[0-9a-fA-F]{6}$/).safeParse(form.get("color"));
  if (!parsedName.success || !color.success || !parsedParent.success) redirect("/activities?invalid=1");
  const fields = { name: parsedName.data, color: color.data };
  const { data, error } = await (id ? db.from("folders").update(fields).eq("id", id)
    : db.from("folders").insert({ ...fields, parent_id: parsedParent.data || null })).select("id").single();
  check(error, "save_folder");
  redirect(`/activities?folder=${data!.id}&saved=1`);
}

export async function createAssignment(id: string, form: FormData) {
  if (!uuid.safeParse(id).success) notFound();
  const { db, user } = await account(true);
  const { data: activity, error } = await db.from("activities").select("id,title,template,content,draft,deleted_at").eq("id", id).maybeSingle();
  check(error, "assignment_source");
  if (!activity || activity.draft || activity.deleted_at) notFound();
  const template = templateSchema.parse(activity.template);
  const content = contentSchema(template).parse(activity.content);
  const deadline = form.get("deadline");
  const due = typeof deadline === "string" && deadline ? Date.parse(deadline + ":00+07:00") : null;
  if (due !== null && (!Number.isFinite(due) || due <= Date.now())) redirect(`/activities/${id}?invalid=1`);
  const { data, error: insertError } = await privilegedDatabase().from("assignments").insert({
    owner_id: user.id, activity_id: id, title: activity.title, template, content, deadline: due === null ? null : new Date(due).toISOString(),
    require_name: form.has("require_name"), show_score: form.has("show_score"), show_review: form.has("show_review"),
  }).select("id").single();
  check(insertError, "create_assignment");
  redirect(`/assignments/${data!.id}`);
}

export async function setAssignmentClosed(id: string, closed: boolean) {
  if (!uuid.safeParse(id).success) notFound();
  const { db } = await account(true);
  const { error } = await db.from("assignments").update({ closed }).eq("id", id).select("id").single();
  check(error, "update_assignment");
  redirect(`/assignments/${id}?saved=1`);
}
