"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { demos } from "@/lib/demo";
import { isWordTemplate } from "@/lib/games/word-templates";
import { isPuzzleTemplate } from "@/lib/games/puzzle-templates";
import { isArcadeTemplate } from "@/lib/games/arcade-templates";

export function Templates({ creator = false }: { creator?: boolean }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(() => new Set());
  const grid = useRef<HTMLDivElement>(null);
  const query = search.trim().toLocaleLowerCase();
  const visible = demos.filter(({ id, demoTitle, title }) => {
    const group = isArcadeTemplate(id) ? "arcade" : isWordTemplate(id) ? "word" : isPuzzleTemplate(id) ? "puzzle" : "classroom";
    return (category === "all" || category === group) && (title + " " + demoTitle).toLocaleLowerCase().includes(query);
  });
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const inside = entries.filter(entry => entry.isIntersecting);
      if (!inside.length) return;
      setLoaded(previous => new Set([...previous, ...inside.map(entry => (entry.target as HTMLElement).dataset.thumbnail!)]));
      inside.forEach(entry => observer.unobserve(entry.target));
    }, { rootMargin: "240px" });
    grid.current?.querySelectorAll("[data-thumbnail]").forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [query, category]);
  return <div className="stack game-gallery">
    <div className="gallery-tools">
      <label>Tìm mẫu<input type="search" value={search} onChange={event => setSearch(event.target.value)}/></label>
      <label>Nhóm trò chơi<select value={category} onChange={event => setCategory(event.target.value)}>
        <option value="all">Tất cả</option><option value="classroom">Trò chơi lớp học</option>
        <option value="word">Từ vựng</option><option value="puzzle">Câu đố</option><option value="arcade">Arcade</option>
      </select></label>
    </div>
    <div className="template-grid" ref={grid}>{visible.map(({ id, demoTitle, color, title }) => {
    return <Link className="template-card" key={id} href={creator ? `/activities/new?template=${id}` : `/demo/${id}`}>
      <span aria-hidden="true" className={`template-picture ${color}`} data-thumbnail={id}>
        {loaded.has(id) && <Image src={`/illustrations/gameplay/${id}.webp`} alt="" fill unoptimized loading="lazy"/>}
        <ArrowUpRight size={18}/></span>
      <div><strong>{creator ? title : demoTitle}</strong>{!creator && <small>{title}</small>}</div>
    </Link>;
  })}</div>
  {visible.length === 0 && <p role="status">Không tìm thấy mẫu phù hợp.</p>}</div>;
}
