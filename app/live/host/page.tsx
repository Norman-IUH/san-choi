import Link from "next/link";
import {account,check,privilegedDatabase} from "@/lib/supabase";
import {z} from "zod";

export default async function LiveRooms({searchParams}:{searchParams:Promise<{classroom?:string}>}) {
  const [{user},params]=await Promise.all([account(true),searchParams]);
  const classroom=z.uuid().safeParse(params.classroom).data;
  let query=privilegedDatabase().from("live_rooms").select("id,title,phase").eq("owner_id",user.id);
  if(classroom) query=query.eq("classroom_id",classroom);
  const {data,error}=await query.order("created_at",{ascending:false}).limit(50);
  check(error,"list_live_rooms");
  return <div className="narrow stack"><h1>Phòng trực tiếp của tôi</h1><Link href="/activities">Chọn hoạt động để mở phòng</Link>
    {data?.length ? <ul className="assignment-list">{data.map(room=><li key={room.id}>
      <Link href={`/live/host/${room.id}`}>{room.title}</Link><span>{{lobby:"Đang chờ",playing:"Đang chơi",paused:"Tạm dừng",ended:"Đã kết thúc"}[room.phase as string]}</span>
    </li>)}</ul> : <p>Chưa có phòng.</p>}
  </div>;
}
