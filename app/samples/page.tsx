import Link from "next/link";
import { deckIds, englishDecks } from "@/lib/english-samples";

export const metadata = { title: "Học liệu tiếng Anh" };

export default function Samples() {
  return <div className="page stack english-library"><h1>Học liệu tiếng Anh</h1>
    <p className="muted">Chọn cấp độ để chơi thử hoặc đưa bộ từ vựng vào thư viện cá nhân.</p>
    <div className="template-grid">{deckIds.map(id => {
      const deck = englishDecks[id];
      return <Link key={id} className="sample-link" href={`/samples/${id}`}>
        <span className={`sample-art sample-art-${id}`} aria-hidden="true"/>
        <div className="sample-copy"><strong>{deck.level}</strong><h2 lang="en">{deck.title}</h2><span>{deck.entries.length} từ vựng</span></div>
      </Link>;
    })}</div>
  </div>;
}
