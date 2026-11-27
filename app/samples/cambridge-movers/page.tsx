import Link from "next/link";
import { moverPartNames, moverSeconds, starterPapers, starterPaperSchema } from "@/lib/games/starters";

export const metadata = { title: "Cambridge A1 Movers" };

export default function Movers() {
  return <div className="page stack starters-library">
    <Link className="back" href="/samples">← Học liệu tiếng Anh</Link>
    <header className="starter-cover">
      <p className="welcome">Paper-based</p>
      <h1>Cambridge A1 Movers</h1>
      <p>Chọn một Part để luyện tập hoặc làm một bài thi thử. Phần Speaking cần giáo viên hướng dẫn.</p>
    </header>
    <div className="starter-paper-grid">{starterPaperSchema.options.map(paper => <section className="panel stack" key={paper}>
      <h2 lang="en">{starterPapers[paper]}</h2>
      <ol>{moverPartNames[paper].map((label, i) => <li key={label}>
        <Link href={`/samples/cambridge-movers/${paper}?part=${i + 1}`}>Part {i + 1} · {label}</Link>
      </li>)}</ol>
      <Link className="button primary" href={`/samples/cambridge-movers/${paper}`}>Thi thử · {moverSeconds[paper] / 60} phút</Link>
    </section>)}</div>
    <p className="hint">Học liệu do Sân Chơi biên soạn. Giáo viên chấm Speaking và các câu viết mở.</p>
  </div>;
}
