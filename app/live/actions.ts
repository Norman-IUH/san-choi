"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { account, check, privilegedDatabase, serverConfigured } from "@/lib/supabase";
import { contentSchema, templateSchema } from "@/lib/game";
import { lessonActivity } from "@/lib/lesson-plan-server";
import { lessonPlanSchema } from "@/lib/lesson-plan";
import { attemptLimit } from "@/lib/attempt-rate";
import { joinCodeSchema } from "@/lib/classroom";
import { studentCodeHash } from "@/lib/student-code";
import { liveCode, liveCommands, liveGrade } from "@/lib/live";
import { createLiveSnapshot, findRoom, liveCookie, liveGuestToken, roomState, verifyPlayer } from "@/lib/live-server";

const uuid = z.uuid();
const unavailable = "Phòng chưa sẵn sàng hoặc mã không hợp lệ.";

export async function goToLiveRoom(form:FormData) {
  const code = liveCode.safeParse(form.get("code"));
  redirect(code.success ? `/live/join/${code.data}` : "/live?invalid=1");
}

export async function hostActivity(id:string, form:FormData) {
  const {db,user} = await account(true);
  if (!uuid.safeParse(id).success) notFound();
  const {data,error} = await db.from("activities").select("title,template,content")
    .eq("id",id).eq("owner_id",user.id).eq("draft",false).is("deleted_at",null).maybeSingle();
  check(error,"live_activity");
  if (!data) notFound();
  const template = templateSchema.parse(data.template);
  await createLiveSnapshot({title:data.title,template,items:contentSchema(template).parse(data.content),activityId:id},form);
}

export async function hostLesson(id:string, stepId:string, form:FormData) {
  const {db,user} = await account(true);
  if (!uuid.safeParse(id).success || !uuid.safeParse(stepId).success) notFound();
  const {data,error} = await db.from("vocabulary_lessons").select("plan").eq("owner_id",user.id).eq("id",id).maybeSingle();
  check(error,"live_lesson");
  const plan = lessonPlanSchema.safeParse(data?.plan).data;
  const step = plan?.steps.find(row=>row.id===stepId);
  if (!step || plan?.draft) notFound();
  const activity = await lessonActivity(db,user.id,step);
  if (!activity || activity.draft) notFound();
  await createLiveSnapshot({...activity,lessonId:id},form);
}

export async function joinLive(code:string, studentCode:string) {
  const parsed = liveCode.safeParse(code);
  if (!serverConfigured || !parsed.success) return {error:unavailable};
  const db = privilegedDatabase();
  const limit = await attemptLimit(db,"live","start");
  if (limit) return {error:limit};
  const room = await findRoom("code",parsed.data);
  if (!room) return {error:unavailable};
  const personal = joinCodeSchema.safeParse(studentCode);
  const token = await liveGuestToken(parsed.data) ?? randomBytes(32).toString("base64url");
  const {data,error} = await db.rpc("join_live_room",{p_room:room.id,p_hash:studentCodeHash(token),
    p_code:personal.success ? studentCodeHash(personal.data) : null});
  if (error || data!=="ok") return {error:data==="full" ? "Phòng đã đủ 30 người." : data==="code" ?
    "Nhập mã cá nhân hợp lệ của học sinh trong lớp." : unavailable};
  (await cookies()).set(liveCookie(parsed.data),token,{httpOnly:true,sameSite:"strict",
    secure:process.env.VERCEL==="1" || process.env.APP_URL?.startsWith("https:"),path:"/",maxAge:14400});
  const player=await verifyPlayer(room,token);
  return player ? {state:await roomState(room,player)} : {error:unavailable};
}

async function guestRoom(code:string) {
  const parsed = liveCode.safeParse(code);
  if (!serverConfigured || !parsed.success) return null;
  const token = await liveGuestToken(parsed.data);
  if (!token) return null;
  const room = await findRoom("code",parsed.data);
  const player = room && await verifyPlayer(room,token);
  return room && player ? {room,player,token} : null;
}

export async function refreshGuest(code:string) {
  const match=await guestRoom(code);
  return match ? roomState(match.room,match.player) : null;
}

export async function readyLive(code:string) {
  const match=await guestRoom(code);
  if (!match || match.room.phase==="ended" || Date.parse(match.room.expires_at)<=Date.now()) return {error:unavailable};
  const {error}=await privilegedDatabase().from("live_players").update({ready:true}).eq("room_id",match.room.id)
    .eq("id",match.player.id).eq("token_hash",studentCodeHash(match.token)).eq("ready",false);
  return error ? {error:unavailable} : {state:await refreshGuest(code)};
}

export async function answerLive(code:string,index:number,choices:number[]) {
  const input=z.object({index:z.number().int().min(0).max(59),choices:z.array(z.number().int().min(0).max(7)).min(1).max(8)})
    .safeParse({index,choices});
  if (!input.success) return {error:"Kiểm tra phương án đã chọn."};
  const match=await guestRoom(code);
  if (!match) return {error:unavailable};
  const db=privilegedDatabase();
  const limited=await attemptLimit(db,match.room.id,"finish","live:"+match.player.id);
  if (limited) return {error:limited};
  const item=match.room.items[index];
  const correct=item ? liveGrade(match.room.template,item,choices) : null;
  if (correct===null) return {error:"Kiểm tra phương án đã chọn."};
  const {data,error}=await db.rpc("submit_live_answer",{p_room:match.room.id,p_hash:studentCodeHash(match.token),
    p_question:index,p_choices:choices,p_correct:correct});
  return error || data!=="ok" ? {error:"Phòng đã đổi câu hoặc đang tạm dừng. Hãy đồng bộ lại.",state:await refreshGuest(code)} :
    {state:await refreshGuest(code)};
}

export async function refreshHost(id:string) {
  const {user}=await account(true);
  const room=uuid.safeParse(id).success && await findRoom("id",id,user.id);
  return room ? roomState(room) : null;
}

export async function controlLive(id:string,command:string,index:number) {
  const {user}=await account(true);
  if (!uuid.safeParse(id).success || !liveCommands.safeParse(command).success ||
    !z.number().int().min(0).max(59).safeParse(index).success) return {error:"Thao tác chưa hợp lệ."};
  const db=privilegedDatabase();
  const {data,error}=await db.rpc("control_live_room",{p_room:id,p_owner:user.id,p_action:command,p_question:index});
  return error || data!==true ? {error:"Không thể đổi trạng thái phòng."} : {state:await refreshHost(id)};
}
