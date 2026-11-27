import { z } from "zod";
import { account, privilegedDatabase } from "@/lib/supabase";
import { storedVoice, streamVoice, voiceSlotSchema } from "@/lib/voice-server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; item: string }> }) {
  const [{ id, item }, { db }] = await Promise.all([params, account(true)]);
  const index = voiceSlotSchema.safeParse(item).data;
  if (!z.uuid().safeParse(id).success || index === undefined) return new Response(null, { status: 404 });
  const { data: ownAttempt } = await db.from("attempts").select("id").eq("id", id).not("completed_at", "is", null).maybeSingle();
  if (!ownAttempt) return new Response(null, { status: 404 });
  const service = privilegedDatabase();
  const { data } = await storedVoice(service, id, index);
  return data ? streamVoice(service, data, request) : new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
}
