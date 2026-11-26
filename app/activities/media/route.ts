import { fileTypeFromBuffer } from "file-type";
import { account } from "@/lib/supabase";
import { mediaBucket, mediaSize } from "@/lib/media";

const types: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp",
  "audio/mpeg": "mp3", "audio/wav": "wav", "audio/ogg": "ogg",
};

export async function POST(request: Request) {
  const { db, user } = await account(true);
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  const length = Number(request.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0 || length > mediaSize + 65536) {
    return Response.json({ error: "Tệp vượt giới hạn 3 MB." }, { status: 413 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !file.size || file.size > mediaSize) {
    return Response.json({ error: "Chọn một tệp tối đa 3 MB." }, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(bytes).catch(() => undefined);
  const mime = detected?.mime;
  const kind = form?.get("kind");
  if (!mime || !Object.hasOwn(types, mime) || (kind !== "image" && kind !== "audio") || !mime.startsWith(kind + "/")) {
    return Response.json({ error: "Định dạng tệp không phù hợp." }, { status: 415 });
  }
  const path = `${user.id}/${crypto.randomUUID()}.${types[mime]}`;
  const bucket = db.storage.from(mediaBucket);
  const { error } = await bucket.upload(path, bytes, { contentType: mime, upsert: false });
  if (error) return Response.json({ error: "Chưa tải lên được tệp." }, { status: 502 });
  const { data } = await bucket.createSignedUrl(path, 3600);
  return Response.json({ path, url: data?.signedUrl });
}
