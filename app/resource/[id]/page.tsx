import { notFound } from "next/navigation";
import { z } from "zod";
import { Player } from "@/components/Player";
import { contentSchema, isTemplate } from "@/lib/game";
import { localPlay } from "@/lib/local-play";
import { serverConfigured } from "@/lib/supabase";
import { publicActivity } from "@/lib/public-activity";
import { mediaUrls } from "@/lib/media-server";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  if (!serverConfigured || !z.uuid().safeParse(id).success) return { title: "Hoạt động" };
  const data = await publicActivity(id);
  return { title: data?.title ?? "Hoạt động", description: data?.description || undefined,
    ...(data?.visibility === "unlisted" && { robots: { index: false, follow: false } }) };
}

export default async function Resource({ params }: Props) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  if (!serverConfigured) return <div className="narrow"><section className="panel stack"><h1>Hoạt động</h1>
    <p className="notice" role="status">Máy chủ học liệu chưa kết nối. Hãy thử lại sau.</p>
  </section></div>;
  const data = await publicActivity(id);
  if (!data || !isTemplate(data.template)) notFound();
  const content = contentSchema(data.template).safeParse(data.content);
  if (!content.success || content.data.some(item => item.practice)) notFound();
  return <div className="immersive-page"><Player title={data.title} description={data.description ?? undefined} backHref="/community"
    mediaScope={{ source: "resource", id }} {...localPlay(data.template, content.data, await mediaUrls(content.data, data.owner_id))}/></div>;
}
