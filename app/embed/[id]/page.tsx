import {notFound} from "next/navigation";
import {z} from "zod";
import {Player} from "@/components/Player";
import {publicActivity} from "@/lib/public-activity";
import {contentSchema,isTemplate} from "@/lib/game";
import {localPlay} from "@/lib/local-play";
import {mediaUrls} from "@/lib/media-server";
import {serverConfigured} from "@/lib/supabase";

export const metadata={title:"Hoạt động nhúng",robots:{index:false,follow:false}};
export default async function EmbedActivity({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(!serverConfigured || !z.uuid().safeParse(id).success) notFound();
  const activity=await publicActivity(id,true);
  if(!activity || !isTemplate(activity.template)) notFound();
  const content=contentSchema(activity.template).safeParse(activity.content);
  if(!content.success || content.data.some(item=>item.practice)) notFound();
  const assets=await mediaUrls(content.data,activity.owner_id);
  return <div className="embedded-activity"><Player title={activity.title} mediaScope={{source:"embed",id}}
    {...localPlay(activity.template,content.data,assets)}/></div>;
}
