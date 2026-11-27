import "server-only";
import { z } from "zod";
import { vocabularyCatalog } from "./vocabulary-catalog";
import { check, type database } from "./supabase";
import type { BankWord } from "./vocabulary-bank";

type Database = Awaited<ReturnType<typeof database>>;
const columns = "id,word,meaning,level,topic,part,ipa,example,related,image,uk,us,archived_at";
const uuid = z.uuid();
const catalog = new Map(vocabularyCatalog.map(word => [word.id, word]));

export async function loadWords(db: Database, owner: string, keys: string[]) {
  const ids = keys.filter(key => uuid.safeParse(key).success);
  const words = new Map(catalog);
  if (ids.length) {
    const { data, error } = await db.from("vocabulary_entries").select(columns).eq("owner_id", owner).in("id", ids);
    check(error, "load_bank_selection");
    for (const word of (data ?? []) as BankWord[]) words.set(word.id, word);
  }
  return keys.flatMap(key => words.get(key) ?? []);
}

export async function listBankWords(db: Database, owner: string, includeArchived = false) {
  const words: BankWord[] = [];
  const size = 500;
  for (let offset = 0; ; offset += size) {
    const query = db.from("vocabulary_entries").select(columns).eq("owner_id", owner);
    if (!includeArchived) query.is("archived_at", null);
    const { data, error } = await query.order("id").range(offset, offset + size - 1);
    check(error, "list_bank_words");
    words.push(...(data ?? []) as BankWord[]);
    if (!data || data.length < size) return words;
  }
}
