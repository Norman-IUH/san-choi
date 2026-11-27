import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { VocabularyWordForm } from "@/components/VocabularyWordForm";
import { account } from "@/lib/supabase";
import { mediaUrls } from "@/lib/media-server";
import { loadWords } from "@/lib/vocabulary-server";
import { wordItem } from "@/lib/vocabulary-bank";
import { setWordArchived } from "../../actions";

export default async function Word({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ copy?: string; problem?: string }>;
}) {
  const [{ id }, query, { db, user }] = await Promise.all([params, searchParams, account(true)]);
  const create = id === "new";
  if (!create && !z.uuid().safeParse(id).success) notFound();
  const key = create ? query.copy : id;
  const [word] = key ? await loadWords(db, user.id, [key]) : [];
  if (key && !word) notFound();
  const assets = word ? await mediaUrls([wordItem(word)], user.id) : {};
  return <div className="narrow wide stack bank-page">
    <Link className="back" href="/library">← Thư viện tiếng Anh</Link>
    <h1>{create ? "Thêm từ vựng" : "Sửa từ vựng"}</h1>
    {query.problem && <p role="alert" className="notice error">{query.problem}</p>}
    <VocabularyWordForm id={create ? null : id} initial={word} assets={assets}/>
    {!create && word && <form action={setWordArchived.bind(null, id, !word.archived_at)}>
      <button className="button">{word.archived_at ? "Khôi phục từ" : "Lưu trữ từ"}</button>
    </form>}
  </div>;
}
