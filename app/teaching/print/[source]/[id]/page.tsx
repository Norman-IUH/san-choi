import Link from "next/link";
import { notFound } from "next/navigation";
import { printable, type PrintParams } from "@/lib/worksheet-server";
import { WorksheetPreview } from "@/components/WorksheetPreview";

export const metadata = { title: "In học liệu", robots: { index: false, follow: false } };

export default async function Print({ params, searchParams }: {
  params: Promise<PrintParams>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [route, search] = await Promise.all([params, searchParams]);
  const query = new URLSearchParams();
  for (const name of ["paper", "part"]) if (typeof search[name] === "string") query.set(name, search[name]);
  const source = await printable(route, query);
  if (!source) notFound();
  const endpoint = `/teaching/print/${route.source}/${route.id}/pdf${query.size ? "?" + query : ""}`;
  return <div className="narrow wide stack print-workbench">
    <Link className="back" href={source.back}>← Về học liệu</Link>
    <header><h1>In học liệu</h1><p className="muted">{source.title}</p></header>
    <WorksheetPreview endpoint={endpoint} title={source.title} keys={source.keys} transcript={source.transcript}/>
  </div>;
}
