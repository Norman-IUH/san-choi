import Link from "next/link";
import { cambridgeLevelSchema, cambridgeLevels, cambridgePartNames, cambridgeSeconds, starterPapers, starterPaperSchema } from "@/lib/games/starters";

export const metadata = { title: "Cambridge Practice" };

export default function CambridgeDashboard() {
  return <div className="page stack starters-library">
    <Link className="back" href="/samples">← Học liệu tiếng Anh</Link>
    <header className="starter-cover">
      <p className="welcome">Paper-based</p>
      <h1>Cambridge Practice</h1>
      <p>Luyện từng Part, thi thử theo kỹ năng hoặc lưu bộ đề vào thư viện để giao bài.</p>
    </header>
    <div className="starter-paper-grid">{cambridgeLevelSchema.options.map(level => {
      const path = `/samples/cambridge-${level}`;
      return <section key={level} className="panel stack">
        <h2>{cambridgeLevels[level]}</h2>
        <ul className="cambridge-dashboard-list">{starterPaperSchema.options.map(paper => <li key={paper}>
          <div><strong lang="en">{starterPapers[paper]}</strong><p>{cambridgePartNames[level][paper].length} Part</p></div>
          <Link href={`${path}/${paper}`} aria-label={`Thi thử ${cambridgeLevels[level]} ${starterPapers[paper]}`}>Thi thử · {cambridgeSeconds[level][paper] / 60} phút</Link>
        </li>)}</ul>
        <Link href={path} className="button primary">Luyện {cambridgeLevels[level]}</Link>
      </section>;
    })}</div>
    <div className="inline-actions">
      <Link className="button" href="/activities">Hoạt động của giáo viên</Link>
      <Link className="button" href="/results">Kết quả bài giao</Link>
    </div>
  </div>;
}
