import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { demos } from "@/lib/demo";
import { isWordTemplate } from "@/lib/games/word-templates";
import { isPuzzleTemplate } from "@/lib/games/puzzle-templates";
import { isArcadeTemplate } from "@/lib/games/arcade-templates";

export function Templates({ creator = false }: { creator?: boolean }) {
  return <div className="template-grid">{demos.map(({ id, demoTitle, icon, color, title }) => {
    const gameplayThumbnail = isArcadeTemplate(id) || isWordTemplate(id) || isPuzzleTemplate(id);
    return <Link className="template-card" key={id} href={creator ? `/activities/new?template=${id}` : `/demo/${id}`}>
      <span aria-hidden="true" className={`template-picture ${color}${gameplayThumbnail ? " word-template-picture" : ""}`}
        style={gameplayThumbnail ? { backgroundImage: `url(/illustrations/gameplay/${id}.webp)` } : undefined}>
        <span>{gameplayThumbnail ? "" : icon}</span><ArrowUpRight size={18}/></span>
      <div><strong>{creator ? title : demoTitle}</strong>{!creator && <small>{title}</small>}</div>
    </Link>;
  })}</div>;
}
