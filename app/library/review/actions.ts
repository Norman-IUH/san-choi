"use server";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { account, check } from "@/lib/supabase";
import { loadWords } from "@/lib/vocabulary-server";
import { wordSignature } from "@/lib/vocabulary-review-server";

export async function reviewWord(id: string, filter: string, signature: string, form: FormData) {
  const { db, user } = await account(true);
  if (!z.string().min(1).max(160).safeParse(id).success) notFound();
  const query = new URLSearchParams(filter);
  const next = z.enum(["pending", "changes", "approved"]).safeParse(form.get("state"));
  const note = z.string().trim().max(1500).safeParse(form.get("note"));
  if (!next.success || !note.success) redirect("/library/review?result=invalid");
  const [word] = await loadWords(db, user.id, [id]);
  if (!word || word.archived_at) notFound();
  const observed = wordSignature(word);
  if (signature !== observed) {
    query.set("result", "changed");
    redirect(`/library/review?${query}`);
  }
  const { error } = await db.from("vocabulary_reviews").upsert({ entry_key: id, state: next.data,
    signature: observed, note: note.data, reviewer_id: next.data === "pending" ? null : user.id,
    reviewed_at: next.data === "pending" ? null : new Date().toISOString() }, { onConflict: "owner_id,entry_key" });
  check(error, "save_word_review");
  query.set("result", "saved");
  redirect(`/library/review?${query}`);
}
