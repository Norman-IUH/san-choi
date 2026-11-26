import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

export const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
export const serverConfigured = configured && Boolean(process.env.SUPABASE_SECRET_KEY);
export const singleTeacher = process.env.TEACHING_MODE === "single" || process.env.VERCEL_ENV === "production";
export const teacherId = z.uuid().safeParse(process.env.TEACHER_ACCOUNT_ID).data?.toLowerCase();
export const allowedTeacher = (id: string) => !singleTeacher || id === teacherId;

export function urlFor(path: string) {
  return new URL(path, process.env.APP_URL ?? "http://localhost:3000").toString();
}

export async function database() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(entries) {
        try {
          entries.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // The request proxy refreshes cookies for Server Components.
        }
      },
    },
  });
}

export function privilegedDatabase() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!configured || !secret) throw new Error("Supabase server configuration is missing");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function account(teacher = false) {
  if (!configured) redirect("/login?setup=1");
  const db = await database();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  if (!allowedTeacher(user.id)) redirect("/login?message=teacher-only");
  const { data: profile, error } = await db.from("profiles").select("role,display_name").eq("id", user.id).single();
  if (error || !profile) throw new Error("Không đọc được hồ sơ");
  if (teacher && profile.role !== "teacher") redirect("/profile");
  return { db, user, profile };
}

export function check(error: { code?: string } | null, operation: string) {
  if (!error) return;
  console.error(JSON.stringify({ operation, code: error.code }));
  throw new Error("Thao tác chưa hoàn tất. Hãy thử lại.");
}
