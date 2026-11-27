import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { itemSchema } from "./game";
import { isSpeaking } from "./games/productive";
import { allowedTeacher, privilegedDatabase, serverConfigured } from "./supabase";

export const voiceBucket = "practice-voice";
export const voiceSlotSchema = z.string().regex(/^(?:[0-9]|1[01])$/).transform(Number);

export function voicePolicy() {
  if (process.env.VOICE_RECORDING_ENABLED !== "1") return null;
  if (process.env.VOICE_RECORDING_RELEASE_APPROVED === "1") return { fixture: null };
  const fixture = process.env.VOICE_RECORDING_FIXTURE_SHA256;
  const loopback = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/?$/.test(process.env.APP_URL ?? "");
  return !process.env.VERCEL && loopback && fixture && /^[a-f0-9]{64}$/.test(fixture) ? { fixture } : null;
}

export function voiceExpiry() {
  const days = z.coerce.number().int().min(1).max(30).safeParse(process.env.VOICE_RECORDING_RETENTION_DAYS).data ?? 14;
  return new Date(Date.now() + days * 86400000).toISOString();
}

export const voiceDigest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
export const voicePlayable = (expires: string) => Date.parse(expires) > Date.now();

export async function recordingSession(id: string, index: number) {
  if (!serverConfigured || !z.uuid().safeParse(id).success) return null;
  const token = (await cookies()).get(`attempt-${id}`)?.value;
  if (!token || !z.uuid().safeParse(token).success) return null;
  const db = privilegedDatabase();
  const { data: attempt } = await db.from("attempts").select("id,assignments!inner(owner_id,closed,deadline,content)")
    .eq("id", token).eq("assignment_id", id).is("completed_at", null).maybeSingle()
    .overrideTypes<{ id: string; assignments: { owner_id: string; closed: boolean; deadline: string | null; content: unknown[] } }, { merge: false }>();
  if (!attempt) return null;
  const { owner_id: owner, closed, deadline, content } = attempt.assignments;
  if (!allowedTeacher(owner) || closed || (deadline && Date.parse(deadline) <= Date.now())) return null;
  const item = itemSchema.safeParse(content[index]);
  const practice = item.success && item.data.practice;
  if (!practice || !practice.production || !isSpeaking(practice.mode)) return null;
  return { db, token, owner, duration: practice.production.duration };
}

export async function storedVoice(db: ReturnType<typeof privilegedDatabase>, attempt: string, index: number) {
  return db.from("voice_recordings").select("object_path,sha256,expires_at").eq("attempt_id", attempt).eq("item_index", index).maybeSingle();
}

export async function streamVoice(db: ReturnType<typeof privilegedDatabase>, clip: { object_path: string; expires_at: string }, request: Request) {
  const ttl = Math.floor((Date.parse(clip.expires_at) - Date.now()) / 1000);
  const headers = new Headers({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" });
  if (!(ttl > 0)) return new Response(null, { status: 404, headers });
  const range = request.headers.get("range");
  if (range && !/^bytes=(?:\d{1,8}-\d{0,8}|-\d{1,8})$/.test(range)) return new Response(null, { status: 416, headers });
  const signed = await db.storage.from(voiceBucket).createSignedUrl(clip.object_path, Math.min(90, ttl));
  if (!signed.data?.signedUrl) return new Response(null, { status: 404, headers });
  const media = await fetch(signed.data.signedUrl, { cache: "no-store",
    headers: { "Accept-Encoding": "identity", ...(range && { Range: range }) } }).catch(() => null);
  if (!media?.ok) return new Response(null, { status: media?.status === 416 ? 416 : 404, headers });
  for (const key of ["content-type", "content-length", "accept-ranges", "content-range"] as const) {
    const value = media.headers.get(key);
    if (value) headers.set(key, value);
  }
  const extension = clip.object_path.split(".").at(-1);
  if (new URL(request.url).searchParams.has("download") && extension && /^[a-z0-9]{3,4}$/.test(extension)) {
    headers.set("Content-Disposition", `attachment; filename="speaking.${extension}"`);
  }
  return new Response(media.body, { status: media.status, headers });
}

export async function removeVoice(db: ReturnType<typeof privilegedDatabase>, attempt: string, index: number, path: string) {
  const { error } = await db.storage.from(voiceBucket).remove([path]);
  if (error) return false;
  const deleted = await db.from("voice_recordings").delete().eq("attempt_id", attempt).eq("item_index", index).eq("object_path", path);
  return !deleted.error;
}
