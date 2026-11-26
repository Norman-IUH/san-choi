import { NextResponse, type NextRequest } from "next/server";
import { allowedTeacher, configured, database, urlFor } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  if (configured && code) {
    const db = await database();
    const { data, error } = await db.auth.exchangeCodeForSession(code);
    if (!error && data.user && allowedTeacher(data.user.id)) {
      return NextResponse.redirect(urlFor(params.get("next") === "profile" ? "/profile" : "/activities"), { headers: { "Cache-Control": "private, no-store" } });
    }
    if (data.user) await db.auth.signOut({ scope: "local" });
  }
  return NextResponse.redirect(urlFor("/login?message=failed"));
}
