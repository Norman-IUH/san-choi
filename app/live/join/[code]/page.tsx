import {notFound} from "next/navigation";
import {liveCode} from "@/lib/live";
import {LiveStage} from "@/components/LiveStage";
import {refreshGuest} from "../../actions";

export const metadata={title:"Tham gia lớp trực tiếp",robots:{index:false,follow:false}};
export default async function LiveGuest({params}:{params:Promise<{code:string}>}) {
  const code=liveCode.safeParse((await params).code);
  if (!code.success) notFound();
  return <div className="narrow wide"><LiveStage code={code.data} initial={await refreshGuest(code.data)}/></div>;
}
