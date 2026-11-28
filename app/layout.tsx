import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Blocks } from "lucide-react";
import "./globals.css";
import "./game-shell.css";
import "./starters.css";

export const metadata: Metadata = {
  title: { default: "Sân Chơi — Học liệu tương tác", template: "%s | Sân Chơi" },
  description: "Tạo trò chơi học tập, giao bài và theo dõi kết quả.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="vi" data-scroll-behavior="smooth"><body>
    <a className="skip" href="#main">Đến nội dung</a>
    <header className="site-header"><div className="header-inner">
      <Link className="brand" href="/"><span><Blocks size={22}/></span>Sân Chơi</Link>
      <nav aria-label="Điều hướng chính"><Link href="/activities">Hoạt động</Link><Link href="/samples">Học liệu mẫu</Link><Link href="/classrooms">Lớp học</Link><Link href="/live">Trực tiếp</Link><Link href="/results">Kết quả</Link></nav>
      <Link className="header-link" href="/profile">Tài khoản <ArrowUpRight size={15}/></Link>
    </div></header><main id="main">{children}</main>
    <footer className="site-footer"><Link href="/" className="brand"><Blocks size={17}/> Sân Chơi</Link><span>Học liệu tương tác cho lớp học</span></footer>
  </body></html>;
}
