import { notFound } from "next/navigation";
import { Player } from "@/components/Player";
import { importCambridge } from "@/app/activities/actions";
import { starterPaperSchema, type CambridgeLevel } from "@/lib/games/starters";
import { localPlay } from "@/lib/local-play";
import { cambridgePapers } from "@/lib/cambridge-papers";

export type PaperPageProps = {
  params: Promise<{ paper: string }>; searchParams: Promise<{ part?: string | string[] }>;
};

export async function CambridgePaper({ params, searchParams, level }: PaperPageProps & { level: CambridgeLevel }) {
  const [{ paper }, { part }] = await Promise.all([params, searchParams]);
  const result = starterPaperSchema.safeParse(paper);
  if (!result.success || (part !== undefined && (typeof part !== "string" || !/^[1-7]$/.test(part)))) notFound();
  const number = part === undefined ? undefined : Number(part);
  const sample = cambridgePapers[level](result.data, number);
  if (!sample) notFound();
  return <div className="immersive-page stack">
    <Player {...localPlay(sample.template, sample.items)} title={sample.title} description={number ? sample.label : undefined} backHref={`/samples/cambridge-${level}`}/>
    <form className="starter-import" action={importCambridge.bind(null, level, paper, number)}>
      <button className="button">Lưu vào thư viện giáo viên</button>
    </form>
  </div>;
}
