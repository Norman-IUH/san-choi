import Link from "next/link";
import { notFound } from "next/navigation";
import { importEnglishDeck } from "@/app/activities/actions";
import { Player } from "@/components/Player";
import { deckIds, englishDeckContent, englishDecks, isDeckId } from "@/lib/english-samples";
import { localPlay } from "@/lib/local-play";

type Props = { params: Promise<{ level: string }>; searchParams: Promise<{ game?: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return deckIds.map(level => ({ level })); }
export async function generateMetadata({ params }: Props) {
  const { level } = await params;
  return { title: isDeckId(level) ? englishDecks[level].title : "Học liệu tiếng Anh" };
}

export default async function Sample({ params, searchParams }: Props) {
  const [{ level }, { game }] = await Promise.all([params, searchParams]);
  if (!isDeckId(level)) notFound();
  const deck = englishDecks[level];
  const template = game === "match-up" ? "match-up" : "flash-cards";
  return <div className="narrow stack">
    <Link className="back" href="/samples">← Học liệu tiếng Anh</Link>
    <div className="section-head"><strong>{deck.level}</strong><div className="inline-actions" aria-label="Mẫu trò chơi">
      <Link className="button" aria-current={template === "flash-cards" ? "page" : undefined} href={`/samples/${level}`}>Thẻ ghi nhớ</Link>
      <Link className="button" aria-current={template === "match-up" ? "page" : undefined} href={`/samples/${level}?game=match-up`}>Ghép cặp</Link>
    </div></div>
    <Player key={template} title={deck.title} {...localPlay(template, englishDeckContent(level))}/>
    <form action={importEnglishDeck}><input type="hidden" name="level" value={level}/><input type="hidden" name="template" value={template}/>
      <button className="button">Lưu bản sao vào thư viện</button>
    </form>
  </div>;
}
