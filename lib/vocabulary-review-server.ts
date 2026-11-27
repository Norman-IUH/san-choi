import "server-only";
import { createHash } from "node:crypto";
import { check, type database } from "./supabase";
import type { BankWord } from "./vocabulary-bank";

export const wordReviewStates = { pending: "Chưa duyệt", changes: "Cần chỉnh sửa", approved: "Đã duyệt" } as const;
export type WordReviewState = keyof typeof wordReviewStates;
export type WordReview = { entry_key: string; state: WordReviewState; signature: string; note: string; reviewed_at: string | null };

export function wordSignature(word: BankWord) {
  return createHash("sha256").update(JSON.stringify([word.word, word.meaning, word.level, word.topic, word.part,
    word.ipa, word.example, word.related, word.image ?? null, word.uk ?? null, word.us ?? null])).digest("hex");
}

export function currentWordReview(word: BankWord, review: WordReview | undefined): WordReviewState {
  return review?.signature === wordSignature(word) ? review.state : "pending";
}

export async function listWordReviews(db: Awaited<ReturnType<typeof database>>, owner: string) {
  const rows = new Map<string, WordReview>();
  for (let start = 0; ; start += 500) {
    const { data, error } = await db.from("vocabulary_reviews").select("entry_key,state,signature,note,reviewed_at")
      .eq("owner_id", owner).order("entry_key").range(start, start + 499);
    check(error, "list_word_reviews");
    for (const entry of data ?? []) rows.set(entry.entry_key, entry as WordReview);
    if (!data || data.length < 500) return rows;
  }
}
