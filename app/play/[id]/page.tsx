import { notFound } from "next/navigation";
import { cache } from "react";
import { z } from "zod";
import { Player } from "@/components/Player";
import { isTemplate } from "@/lib/game";
import { allowedTeacher, check, serverConfigured, privilegedDatabase } from "@/lib/supabase";
import { voicePolicy } from "@/lib/voice-server";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };
const getPageAssignment = cache(async (id: string) => {
  const { data, error } = await privilegedDatabase().from("assignments")
    .select("title,template,require_name,closed,deadline,owner_id,classroom_id,attempt_cap,classrooms(archived_at)").eq("id", id).maybeSingle()
    .overrideTypes<{ title: string; template: string; require_name: boolean; closed: boolean; deadline: string | null;
      owner_id: string; classroom_id: string | null; attempt_cap: number; classrooms: { archived_at: string | null } | null }, { merge: false }>();
  check(error, "assignment_player");
  return data && allowedTeacher(data.owner_id) ? data : null;
});

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  if (!serverConfigured || !z.uuid().safeParse(id).success) return { title: "Bài tập" };
  const data = await getPageAssignment(id);
  return { title: data?.title ?? "Bài tập", robots: { index: false, follow: false } };
}

export default async function AssignmentPlayer({ params }: Props) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  if (!serverConfigured) return <div className="narrow"><section className="panel stack"><h1>Bài tập</h1>
    <p className="notice" role="status">Máy chủ bài tập chưa kết nối. Hãy liên hệ giáo viên hoặc thử lại sau.</p>
  </section></div>;
  const data = await getPageAssignment(id);
  if (!data || !isTemplate(data.template)) notFound();
  const expired = Boolean(data.deadline && Date.parse(data.deadline) <= new Date().getTime());
  if (data.closed || expired || data.classrooms?.archived_at) return <div className="narrow"><section className="panel"><h1>{data.title}</h1><p>Bài tập đã đóng hoặc hết hạn.</p></section></div>;
  return <div className="immersive-page"><Player title={data.title} template={data.template} backHref="/" assignment={id}
    requireName={data.require_name} classroom={!!data.classroom_id} allowReplay={!data.classroom_id || data.attempt_cap > 1}
    voiceEnabled={!data.classroom_id && Boolean(voicePolicy())}/></div>;
}
