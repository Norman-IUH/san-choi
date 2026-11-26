import { notFound } from "next/navigation";
import { cache } from "react";
import { z } from "zod";
import { Player } from "@/components/Player";
import { contentSchema, isTemplate } from "@/lib/game";
import { localPlay } from "@/lib/local-play";
import { allowedTeacher, check, serverConfigured, privilegedDatabase } from "@/lib/supabase";
import { mediaUrls } from "@/lib/media-server";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };
const getPublicActivity = cache(async (id: string) => {
  const { data, error } = await privilegedDatabase().from("activities").select("title,description,template,content,visibility,owner_id")
    .eq("id", id).in("visibility", ["public", "unlisted"]).eq("draft", false).is("deleted_at", null).maybeSingle();
  check(error, "public_activity");
  return data && allowedTeacher(data.owner_id) ? data : null;
});

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  if (!serverConfigured || !z.uuid().safeParse(id).success) return { title: "Hoạt động" };
  const data = await getPublicActivity(id);
  return { title: data?.title ?? "Hoạt động", description: data?.description || undefined,
    ...(data?.visibility === "unlisted" && { robots: { index: false, follow: false } }) };
}

export default async function Resource({ params }: Props) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  if (!serverConfigured) return <div className="narrow"><section className="panel stack"><h1>Hoạt động</h1>
    <p className="notice" role="status">Máy chủ học liệu chưa kết nối. Hãy thử lại sau.</p>
  </section></div>;
  const data = await getPublicActivity(id);
  if (!data || !isTemplate(data.template)) notFound();
  const content = contentSchema(data.template).safeParse(data.content);
  if (!content.success) notFound();
  return <div className="narrow stack"><Player title={data.title} mediaScope={{ source: "resource", id }} {...localPlay(data.template, content.data, await mediaUrls(content.data, data.owner_id))}/>
    {data.description && <p>{data.description}</p>}</div>;
}
