import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { demos } from "@/lib/demo";
import { isWordTemplate } from "@/lib/games/word-templates";

export function Templates({ creator = false }: { creator?: boolean }) {
  return <div className="template-grid">{demos.map(({ id, demoTitle, icon, color, title }) =>
    <Link className="template-card" key={id} href={creator ? `/activities/new?template=${id}` : `/demo/${id}`}>
      <span aria-hidden="true" className={`template-picture ${color}${isWordTemplate(id) ? " word-template-picture" : ""}`}
        style={isWordTemplate(id) ? { backgroundImage: `url(/illustrations/gameplay/${id}.webp)` } : undefined}>
        <span>{isWordTemplate(id) ? "" : icon}</span><ArrowUpRight size={18}/></span>
      <div><strong>{creator ? title : demoTitle}</strong>{!creator && <small>{title}</small>}</div>
    </Link>)}</div>;
}
