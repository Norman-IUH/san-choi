import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpen, Check, Play, Sparkles } from "lucide-react";
import { Templates } from "@/components/Templates";

export default function Home() {
  return <div className="home"><section className="hero">
    <div className="hero-copy"><span className="eyebrow"><BookOpen size={16}/> Dành cho giáo viên Việt Nam</span>
      <h1>Học mà chơi.<br/><em>Chơi mà nhớ.</em></h1>
      <p>Biến câu hỏi và kiến thức thành trò chơi tương tác. Dùng ngay trong lớp hoặc gửi link để học sinh tự luyện tập.</p>
      <div className="inline-actions"><Link className="button primary" href="/activities/new">Tạo hoạt động <ArrowRight size={18}/></Link>
        <a className="button soft" href="#mau">Khám phá mẫu <ArrowDown size={17}/></a></div>
    </div>
    <div className="hero-art">
      <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
      <Sparkles className="art-spark" size={46} strokeWidth={1.6}/>
      <div className="art-card art-back"><span>Aa</span></div>
      <Link href="/demo/quiz" className="art-card art-front" aria-label="Chơi thử Khám phá hệ Mặt Trời">
        <div><span className="art-label"><Play size={14} fill="currentColor"/> Chơi thử</span><span>01 / 03</span></div>
        <strong>Hành tinh nào<br/>có màu đỏ?</strong>
        <span className="art-answer"><Check size={17}/> Sao Hỏa</span>
      </Link>
      <div className="art-star" aria-hidden="true">✦</div>
    </div>
  </section>
  <section id="mau" className="template-section"><div className="section-head"><div><h2>Khám phá mẫu hoạt động</h2><p>Chọn một trò để chơi thử ngay trên trình duyệt.</p></div><span>{12} mẫu chơi thử</span></div><Templates/></section></div>;
}
