import {notFound} from "next/navigation";
import {z} from "zod";
import Link from "next/link";
import {account,urlFor} from "@/lib/supabase";
import {findRoom,roomState} from "@/lib/live-server";
import {AssignmentShare} from "@/components/AssignmentShare";
import {LiveStage} from "@/components/LiveStage";

export default async function HostRoom({params}:{params:Promise<{id:string}>}) {
  const [{id},{user}]=await Promise.all([params,account(true)]);
  const room=z.uuid().safeParse(id).success && await findRoom("id",id,user.id);
  if (!room) notFound();
  const path=`/live/join/${room.code}`;
  return <div className="narrow wide stack"><Link href="/live/host">← Các phòng trực tiếp</Link>
    <section className="panel stack"><h2>Mời học sinh</h2><p>Mã phòng <strong>{room.code}</strong></p>
      <AssignmentShare path={path} fallback={urlFor(path)} title={room.title}/>
    </section>
    <LiveStage host={id} initial={await roomState(room)}/>
  </div>;
}
