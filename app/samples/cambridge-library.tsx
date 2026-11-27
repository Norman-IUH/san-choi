import Link from "next/link";
import { cambridgeLevels, cambridgePartNames, cambridgeSeconds, starterPapers, starterPaperSchema, type CambridgeLevel } from "@/lib/games/starters";

export function CambridgeLibrary({ level }: { level: CambridgeLevel }) {
  const path = `/samples/cambridge-${level}`;
  return <div className="page stack starters-library">
    <Link className="back" href="/samples/cambridge">← Cambridge Practice</Link>
    <header className="starter-cover">
      <p className="welcome">Paper-based</p>
      <h1>Cambridge {cambridgeLevels[level]}</h1>
      <p>Chọn một Part để luyện tập hoặc làm bài thi thử theo từng kỹ năng. Phần Speaking cần giáo viên hướng dẫn.</p>
    </header>
    <div className="starter-paper-grid">{starterPaperSchema.options.map(paper => <section className="panel stack" key={paper}>
      <h2 lang="en">{starterPapers[paper]}</h2>
      <ol>{cambridgePartNames[level][paper].map((label, i) => <li key={label}>
        <Link href={`${path}/${paper}?part=${i + 1}`}>Part {i + 1} · {label}</Link>
      </li>)}</ol>
      <Link className="button primary" href={`${path}/${paper}`}>Thi thử · {cambridgeSeconds[level][paper] / 60} phút</Link>
    </section>)}</div>
    <p className="hint">Học liệu do Sân Chơi biên soạn. Giáo viên chấm Speaking{level !== "starters" && " và câu viết mở"}.</p>
  </div>;
}
