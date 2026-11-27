"use server";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { assessmentSchema, reviewScores } from "@/lib/games/productive";
import { account, check, privilegedDatabase } from "@/lib/supabase";
import { removeVoice, storedVoice, voiceBucket, voiceSlotSchema } from "@/lib/voice-server";
import { itemSchema } from "@/lib/game";

export async function saveManualReview(id: string, revision: number, _previous: string, form: FormData) {
  const { db, user } = await account(true);
  if (!z.uuid().safeParse(id).success || !z.number().int().min(0).safeParse(revision).success) notFound();
  const { data, error } = await db.from("attempts").select("id,assignments!inner(owner_id,assessment),manual_reviews!inner(revision)")
    .eq("id", id).eq("assignments.owner_id", user.id).not("completed_at", "is", null).maybeSingle()
    .overrideTypes<{ id: string; assignments: { assessment: unknown } }, { merge: false }>();
  check(error, "review_source");
  const snapshot = assessmentSchema.safeParse(data?.assignments?.assessment);
  if (!data || !snapshot.success) notFound();
  const feedback = z.string().trim().max(4000).safeParse(form.get("feedback"));
  if (!feedback.success) return "Nhận xét phải không quá 4.000 ký tự.";
  const publish = form.get("intent") === "publish";
  const score = reviewScores(snapshot.data.rubric, form, publish);
  if (!score) return "Kiểm tra giới hạn điểm. Cần chấm đủ tiêu chí trước khi công bố.";
  const now = new Date().toISOString();
  const result = await privilegedDatabase().from("manual_reviews").update({
    state: publish ? "published" : score.total === null ? "pending" : "reviewed", scores: score.scores, total: score.total,
    feedback: feedback.data, reviewer_id: user.id, reviewed_at: now, published_at: publish ? now : null, revision: revision + 1,
  }).eq("attempt_id", id).eq("revision", revision).select("attempt_id").maybeSingle();
  check(result.error, "save_manual_review");
  if (!result.data) return "Đánh giá đã thay đổi trong một cửa sổ khác. Tải lại để xem bản mới nhất.";
  redirect(`/results/${id}?review=saved`);
}

export async function addClassroomSubmission(id: string, form: FormData) {
  const { db } = await account(true);
  if (!z.uuid().safeParse(id).success) notFound();
  const nickname = z.string().trim().min(1).max(80).safeParse(form.get("nickname"));
  if (!nickname.success) redirect(`/assignments/${id}?review=invalid`);
  const { data, error } = await db.from("assignments").select("id,assessment,content").eq("id", id).maybeSingle();
  check(error, "read_classroom_assessment");
  const snapshot = assessmentSchema.safeParse(data?.assessment);
  const items = z.array(itemSchema).min(1).max(12).safeParse(data?.content);
  if (!snapshot.success || snapshot.data.skill !== "Speaking" || !items.success) notFound();
  const attempt = crypto.randomUUID();
  const { error: insertError } = await privilegedDatabase().from("attempts").insert({ id: attempt, assignment_id: id,
    nickname: nickname.data, completed_at: new Date().toISOString(), total: 0,
    answers: items.data.map(item => ({ prompt: item.prompt, answer: [], correct: null })) });
  check(insertError, "classroom_submission");
  redirect(`/results/${attempt}`);
}

export async function removeTeacherVoice(id: string, item: string) {
  const { db } = await account(true);
  const index = voiceSlotSchema.safeParse(item).data;
  if (!z.uuid().safeParse(id).success || index === undefined) notFound();
  const attempt = await db.from("attempts").select("id").eq("id", id).not("completed_at", "is", null).maybeSingle();
  if (!attempt.data) notFound();
  const service = privilegedDatabase();
  const clip = await storedVoice(service, id, index);
  check(clip.error, "find_voice_for_removal");
  if (clip.data && !await removeVoice(service, id, index, clip.data.object_path)) redirect(`/results/${id}?review=voice-error`);
  redirect(`/results/${id}?review=voice-removed`);
}

export async function cleanExpiredVoice() {
  const { user } = await account(true);
  const db = privilegedDatabase();
  const { data, error } = await db.from("voice_recordings").select("attempt_id,item_index,object_path")
    .like("object_path", user.id + "/%").lte("expires_at", new Date().toISOString()).order("expires_at").limit(100);
  check(error, "list_expired_voice");
  for (const clip of data ?? []) if (!await removeVoice(db, clip.attempt_id, clip.item_index, clip.object_path)) redirect("/results?cleanup=retry");

  // Uploaded objects younger than one day can still be committed by an interrupted request.
  const cutoff = Date.now() - 86400000;
  const bucket = db.storage.from(voiceBucket);
  const orphans: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const listed = await bucket.list(user.id, { limit: 100, offset, sortBy: { column: "created_at", order: "asc" } });
    if (listed.error) redirect("/results?cleanup=retry");
    const files = listed.data ?? [];
    const candidates = files.filter(file => file.id && file.created_at && Date.parse(file.created_at) < cutoff && /^[0-9a-f-]{36}\.(webm|ogg|m4a|wav)$/.test(file.name))
      .map(file => `${user.id}/${file.name}`);
    if (candidates.length) {
      const refs = await db.from("voice_recordings").select("object_path").in("object_path", candidates);
      check(refs.error, "voice_orphan_references");
      const used = new Set(refs.data?.map(row => row.object_path));
      orphans.push(...candidates.filter(path => !used.has(path)));
    }
    if (files.length < 100 || files.some(file => file.created_at && Date.parse(file.created_at) >= cutoff) || orphans.length >= 100) break;
  }
  if (orphans.length && (await bucket.remove(orphans.slice(0, 100))).error) redirect("/results?cleanup=retry");
  redirect("/results?cleanup=done");
}
