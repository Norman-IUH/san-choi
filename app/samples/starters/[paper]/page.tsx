import { notFound } from "next/navigation";
import { Player } from "@/components/Player";
import { importStarter } from "@/app/activities/actions";
import { starterPaperSchema } from "@/lib/games/starters";
import { localPlay } from "@/lib/local-play";
import { starterPaper } from "@/lib/starters-paper";

export const metadata = { title: "Làm bài Starters" };

export default async function StarterPaper({ params, searchParams }: {
  params: Promise<{ paper: string }>; searchParams: Promise<{ part?: string | string[] }>;
}) {
  const [{ paper }, { part }] = await Promise.all([params, searchParams]);
  const result = starterPaperSchema.safeParse(paper);
  if (!result.success || (part !== undefined && (typeof part !== "string" || !/^[1-5]$/.test(part)))) notFound();
  const number = part === undefined ? undefined : Number(part);
  const sample = starterPaper(result.data, number);
  if (!sample) notFound();
  return <div className="immersive-page stack">
    <Player {...localPlay(sample.template, sample.items)} title={sample.title} description={number ? sample.label : undefined} backHref="/samples/starters"/>
    <form className="starter-import" action={importStarter.bind(null, paper, number)}>
      <button className="button">Lưu vào thư viện giáo viên</button>
    </form>
  </div>;
}
