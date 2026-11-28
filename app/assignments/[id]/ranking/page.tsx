import {createHash} from "node:crypto";
import Link from "next/link";
import {notFound} from "next/navigation";
import {z} from "zod";
import {account,check} from "@/lib/supabase";
import {classroomPages} from "@/lib/classroom-server";
import {topRanks} from "@/lib/live";
import {LiveRanking} from "@/components/LiveRanking";

export const metadata={title:"Bảng vinh danh bài giao",robots:{index:false,follow:false}};
export default async function AssignmentRanking({params}:{params:Promise<{id:string}>}) {
  const [{id},{db,user}]=await Promise.all([params,account(true)]);
  if(!z.uuid().safeParse(id).success) notFound();
  const {data,error}=await db.from("assignments").select("title").eq("id",id).eq("owner_id",user.id).maybeSingle();
  check(error,"assignment_ranking_owner");
  if(!data) notFound();
  const rows=await classroomPages((offset,end)=>db.from("attempts").select("id,student_id,score,total")
    .eq("assignment_id",id).not("completed_at","is",null).not("score","is",null).gt("total",0)
    .order("id").range(offset,end));
  const best=new Map<string,number>();
  for(const row of rows) {
    const key=String(row.student_id ?? row.id);
    const percent=Math.round(100*Number(row.score)/Number(row.total));
    best.set(key,Math.max(best.get(key) ?? 0,percent));
  }
  const ranking=topRanks(Array.from(best,([key,points])=>({
    label:"Bạn "+createHash("sha256").update(id+":"+key).digest("hex").slice(0,6).toUpperCase(),points,
  })));
  return <div className="narrow stack"><Link href={`/assignments/${id}`}>← Bài giao</Link><h1>{data.title}</h1>
    <p>Vinh danh điểm tự động cao nhất theo tỷ lệ. Mỗi lượt ẩn danh dùng một bí danh riêng.</p>
    <LiveRanking rows={ranking} percentage inactive/>
  </div>;
}
