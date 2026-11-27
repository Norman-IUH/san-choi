import { notFound } from "next/navigation";
import { Player } from "@/components/Player";
import { demoContent, demos } from "@/lib/demo";
import { templateIds } from "@/lib/game";
import { localPlay } from "@/lib/local-play";

type Props = { params: Promise<{ template: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return templateIds.map(template => ({ template }));
}

export async function generateMetadata({ params }: Props) {
  const { template } = await params;
  return { title: demos.find(demo => demo.id === template)?.demoTitle };
}

export default async function Demo({ params }: Props) {
  const { template } = await params;
  const demo = demos.find(item => item.id === template);
  if (!demo) notFound();
  return <div className="immersive-page">
    <Player title={demo.demoTitle} backHref="/#mau" {...localPlay(demo.id, demoContent(demo.id))}/></div>;
}
