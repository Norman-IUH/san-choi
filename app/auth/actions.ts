"use server";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { z } from "zod";
import { account, allowedTeacher, configured, database, singleTeacher, urlFor } from "@/lib/supabase";

const emailSchema = z.email().max(254);
const passwordSchema = z.string().min(8).max(72);

function authFailure(operation: "login" | "register" | "reset" | "google", error?: AuthError | null): never {
  const code = error?.code && /^[a-z0-9_]+$/i.test(error.code) ? error.code : undefined;
  const status = error?.status;
  console.warn(JSON.stringify({ operation: `auth_${operation}`, code: code ?? "unknown", status }));
  const message = code === "invalid_credentials" ? "credentials"
    : code === "email_not_confirmed" ? "verify"
    : code === "email_address_invalid" ? "invalid-email"
    : code === "signup_disabled" ? "signup-disabled"
    : code === "email_address_not_authorized" || code === "email_provider_disabled" ? "email-unavailable"
    : code === "weak_password" ? "weak-password"
    : status === 429 ? "rate-limited"
    : status === 401 || (status && status >= 500) ? "unavailable"
    : "failed";
  const params = new URLSearchParams({ message });
  if (operation === "register" || operation === "reset") params.set("mode", operation);
  redirect(`/login?${params}`);
}

export async function authenticate(form: FormData) {
  if (!configured) redirect("/login?setup=1");
  const mode = form.get("mode");
  if (singleTeacher && (mode === "register" || mode === "google")) redirect("/login?message=signup-disabled");
  const email = emailSchema.safeParse(form.get("email"));
  const password = passwordSchema.safeParse(form.get("password"));
  const db = await database();
  if (mode === "google" && process.env.GOOGLE_OAUTH_ENABLED === "true") {
    const { data, error } = await db.auth.signInWithOAuth({ provider: "google", options: { redirectTo: urlFor("/auth/callback") } });
    if (error || !data.url) authFailure("google", error);
    redirect(data.url);
  }
  if (!email.success) redirect("/login?message=invalid");
  if (mode === "reset") {
    const { error } = await db.auth.resetPasswordForEmail(email.data, { redirectTo: urlFor("/auth/callback?next=profile") });
    if (error?.status === 429) authFailure("reset", error);
    if (error) console.warn(JSON.stringify({ operation: "auth_reset", status: error.status }));
    redirect("/login?message=reset");
  }
  if (!password.success) redirect("/login?message=invalid");
  if (mode === "register") {
    const { data, error } = await db.auth.signUp({
      email: email.data, password: password.data, options: { emailRedirectTo: urlFor("/auth/callback") },
    });
    if (error) authFailure("register", error);
    redirect(data.session ? "/activities" : "/login?message=verify");
  }
  const { data, error } = await db.auth.signInWithPassword({ email: email.data, password: password.data });
  if (error) authFailure("login", error);
  if (!data.user || !allowedTeacher(data.user.id)) {
    await db.auth.signOut({ scope: "local" });
    redirect("/login?message=teacher-only");
  }
  redirect("/activities");
}

export async function signOut() {
  const { db } = await account();
  const { error } = await db.auth.signOut();
  redirect(error ? "/profile?message=failed" : "/");
}

export async function updateProfile(form: FormData) {
  const { db, user } = await account();
  const name = z.string().trim().min(1).max(100).safeParse(form.get("name"));
  if (!name.success) redirect("/profile?message=failed");
  const { error } = await db.from("profiles").update({ display_name: name.data }).eq("id", user.id);
  redirect(error ? "/profile?message=failed" : "/profile?message=saved");
}

export async function updatePassword(form: FormData) {
  const { db } = await account();
  const password = passwordSchema.safeParse(form.get("password"));
  if (!password.success) redirect("/profile?message=failed");
  const { error } = await db.auth.updateUser({ password: password.data });
  redirect(error ? "/profile?message=failed" : "/profile?message=saved");
}
