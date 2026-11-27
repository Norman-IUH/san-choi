import { maxVoiceBytes, maxVoiceSeconds, inspectVoice } from "@/lib/voice-format";
import { recordingSession, removeVoice, storedVoice, streamVoice, voiceBucket, voiceDigest, voiceExpiry, voicePlayable, voicePolicy, voiceSlotSchema } from "@/lib/voice-server";
import { attemptLimit } from "@/lib/attempt-rate";

type Context = { params: Promise<{ id: string; item: string }> };
const response = (status: number, message: string) => Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
const noContent = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request, { params }: Context) {
  const { id, item } = await params;
  const index = voiceSlotSchema.safeParse(item).data;
  if (!voicePolicy() || index === undefined) return response(404, "Ghi âm không khả dụng.");
  const session = await recordingSession(id, index);
  if (!session) return response(404, "Phiên ghi âm không khả dụng.");
  if (await attemptLimit(session.db, id, "media", "voice-read:" + session.token)) return response(429, "Quá nhiều yêu cầu.");
  const result = await storedVoice(session.db, session.token, index);
  if (result.error) return response(503, "Chưa truy cập được bản ghi.");
  const url = new URL(request.url);
  if (url.searchParams.has("listen")) return result.data ? streamVoice(session.db, result.data, request) : response(404, "Chưa có bản ghi.");
  return Response.json({ saved: Boolean(result.data), url: result.data && voicePlayable(result.data.expires_at) ? `${url.pathname}?listen=1` : undefined },
    { headers: { "Cache-Control": "private, no-store" } });
}

async function readClip(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let length = 0;
  for (;;) {
    const part = await reader.read();
    if (part.done) return Buffer.concat(chunks, length);
    length += part.value.length;
    if (length > maxVoiceBytes) { await reader.cancel(); return null; }
    chunks.push(part.value);
  }
}

export async function POST(request: Request, { params }: Context) {
  const { id, item } = await params;
  const policy = voicePolicy();
  const index = voiceSlotSchema.safeParse(item).data;
  if (!policy || index === undefined || request.headers.get("origin") !== new URL(request.url).origin) return response(404, "Ghi âm không khả dụng.");
  const session = await recordingSession(id, index);
  if (!session) return response(404, "Phiên ghi âm không khả dụng.");
  const { db, token, owner, duration } = session;
  if (await attemptLimit(db, id, "media", "voice:" + token) || await attemptLimit(db, id, "media", "voice-assignment:" + id)) {
    return response(429, "Quá nhiều yêu cầu. Hãy thử lại sau.");
  }
  if (Number(request.headers.get("content-length")) > maxVoiceBytes) return response(413, "Bản ghi vượt giới hạn 2 MB.");
  const bytes = await readClip(request).catch(() => null);
  if (!bytes) return response(413, "Bản ghi vượt giới hạn 2 MB.");
  const clip = await inspectVoice(bytes, request.headers.get("content-type") ?? "", duration || maxVoiceSeconds);
  if (!clip) return response(415, "Tệp audio hoặc thời lượng không hợp lệ.");
  const sha256 = voiceDigest(bytes);
  if (policy.fixture && policy.fixture !== sha256) return response(403, "Môi trường thử chỉ nhận tệp audio tổng hợp đã đăng ký.");
  const existing = await storedVoice(db, token, index);
  if (existing.error) return response(503, "Chưa truy cập được bản ghi.");
  if (existing.data) return existing.data.sha256 === sha256 ? noContent() : response(409, "Hãy xóa bản ghi đã lưu trước khi ghi lại.");
  const path = `${owner}/${crypto.randomUUID()}.${clip.ext}`;
  const bucket = db.storage.from(voiceBucket);
  const { error: uploadError } = await bucket.upload(path, bytes, { contentType: clip.mime, upsert: false, cacheControl: "0" });
  if (uploadError) return response(503, "Chưa tải lên được bản ghi.");
  const { data, error } = await db.rpc("attach_voice_clip", { p_assignment: id, p_attempt: token, p_index: index,
    p_path: path, p_sha256: sha256, p_seconds: clip.seconds, p_expires: voiceExpiry() });
  if (data === true) return noContent();
  const attached = await storedVoice(db, token, index);
  // A lost RPC response can still mean the upload was committed.
  if (!attached.error && attached.data?.object_path !== path) await bucket.remove([path]);
  if (attached.data?.sha256 === sha256) return noContent();
  return response(error ? 503 : 409, "Bản ghi chưa được gắn. Hãy kiểm tra phiên và thử lại.");
}

export async function DELETE(request: Request, { params }: Context) {
  const { id, item } = await params;
  const index = voiceSlotSchema.safeParse(item).data;
  if (!voicePolicy() || index === undefined || request.headers.get("origin") !== new URL(request.url).origin) return response(404, "Ghi âm không khả dụng.");
  const session = await recordingSession(id, index);
  if (!session) return response(404, "Phiên ghi âm không khả dụng.");
  if (await attemptLimit(session.db, id, "media", "voice:" + session.token)) return response(429, "Quá nhiều yêu cầu. Hãy thử lại sau.");
  const existing = await storedVoice(session.db, session.token, index);
  if (existing.error) return response(503, "Chưa truy cập được bản ghi.");
  if (!existing.data || await removeVoice(session.db, session.token, index, existing.data.object_path)) return noContent();
  return response(503, "Chưa xóa được bản ghi. Hãy thử lại.");
}
