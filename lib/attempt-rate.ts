import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import type { privilegedDatabase } from "./supabase";

export async function attemptLimit(db: ReturnType<typeof privilegedDatabase>, id: string, operation: "start" | "finish" | "media" | "student-code", attempt?: string) {
  const ip = process.env.VERCEL === "1" ? (await headers()).get("x-vercel-forwarded-for")?.trim() ?? "" : "";
  // shortcut: non-Vercel hosts share a bucket per assignment until they supply a trusted client address.
  const identity = attempt ? `session:${attempt}` : isIP(ip) ? `ip:${ip}` : `assignment:${id.toLowerCase()}`;
  const scope = createHmac("sha256", process.env.SUPABASE_SECRET_KEY!)
    .update(operation === "student-code" ? `${id}:${identity}` : identity).digest("hex");
  const { data, error } = await db.rpc("consume_attempt_limit", { p_operation: operation, p_scope: scope });
  if (error) {
    console.error(JSON.stringify({ operation: "attempt_rate_limit", code: error.code }));
    return "Máy chủ đang gián đoạn. Hãy thử lại sau.";
  }
  return data === true ? null : "Có quá nhiều yêu cầu. Hãy thử lại sau một phút.";
}
