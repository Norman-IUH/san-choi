import Link from "next/link";
import { starterPartNames, starterPapers, starterPaperSchema, starterSeconds } from "@/lib/games/starters";

export const metadata = { title: "Cambridge Pre A1 Starters" };

export default function Starters() {
  return <div className="page stack starters-library">
    <Link className="back" href="/samples">← Học liệu tiếng Anh</Link>
    <header className="starter-cover">
      <p className="welcome">Paper-based</p>
      <h1>Cambridge Pre A1 Starters</h1>
      <p>Chọn một Part để luyện tập hoặc làm bài thi thử theo từng kỹ năng. Phần Speaking cần giáo viên hướng dẫn.</p>
    </header>
    <div className="starter-paper-grid">{starterPaperSchema.options.map(paper => <section className="panel stack" key={paper}>
      <h2 lang="en">{starterPapers[paper]}</h2>
      <ol>{starterPartNames[paper].map((label, i) => <li key={label}>
        <Link href={`/samples/starters/${paper}?part=${i + 1}`}>Part {i + 1} · {label}</Link>
      </li>)}</ol>
      <Link className="button primary" href={`/samples/starters/${paper}`}>Thi thử · {starterSeconds[paper] / 60} phút</Link>
    </section>)}</div>
    <p className="hint">Học liệu do Sân Chơi biên soạn. Điểm luyện tập được tính theo số câu đúng. Speaking dùng nhận xét của giáo viên.</p>
  </div>;
}
