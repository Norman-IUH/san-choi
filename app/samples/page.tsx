import Link from "next/link";
import { deckIds, englishDecks } from "@/lib/english-samples";

export const metadata = { title: "Học liệu tiếng Anh" };

export default function Samples() {
  return <div className="page stack english-library"><div className="section-head"><h1>Học liệu tiếng Anh</h1>
    <Link className="button" href="/library">Kho từ vựng cho giáo viên</Link></div>
    <p className="muted">Chọn cấp độ để chơi thử hoặc đưa bộ từ vựng vào thư viện cá nhân.</p>
    <section className="panel section-head">
      <div><h2>Cambridge Pre A1 Starters</h2><p>13 phần luyện tập và ba bài thi thử theo cấu trúc Paper-based.</p></div>
      <Link className="button primary" href="/samples/cambridge-starters">Mở bộ luyện Starters</Link>
    </section>
    <section className="panel section-head">
      <div><h2>Cambridge A1 Movers</h2><p>15 phần luyện tập và ba bài thi thử theo cấu trúc Paper-based.</p></div>
      <Link className="button primary" href="/samples/cambridge-movers">Mở bộ luyện Movers</Link>
    </section>
    <div className="template-grid">{deckIds.map(id => {
      const deck = englishDecks[id];
      return <Link key={id} className="sample-link" href={`/samples/${id}`}>
        <span className={`sample-art sample-art-${id}`} aria-hidden="true"/>
        <div className="sample-copy"><strong>{deck.level}</strong><h2 lang="en">{deck.title}</h2><span>{deck.entries.length} từ vựng</span></div>
      </Link>;
    })}</div>
  </div>;
}
