import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const client = createServerClient(url, key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll(entries, headers) {
      for (const { name, value } of entries) request.cookies.set(name, value);
      response = NextResponse.next({ request });
      for (const { name, value, options } of entries) response.cookies.set(name, value, options);
      for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
    },
  } });
  await client.auth.getClaims();
  return response;
}

export const config = { matcher: ["/activities/:path*", "/results/:path*", "/assignments/:path*", "/profile", "/login"] };
