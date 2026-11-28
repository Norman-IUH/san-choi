import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { account, allowedTeacher, check, privilegedDatabase } from "./supabase";
import { contentSchema, type Item } from "./game";
import { mediaUrls } from "./media-server";
import { liveCompatible, liveQuestion, liveTemplate, type LiveState } from "./live";
import { studentCodeHash } from "./student-code";

export type Room = {
  id: string; owner_id: string; classroom_id: string|null; code: string; guest_topic: string; host_topic: string;
  title: string; template: z.infer<typeof liveTemplate>; items: Item[]; phase: LiveState["phase"]; pace: LiveState["pace"];
  question: number; expires_at: string; leaderboard: boolean; teams: boolean;
};
export type LivePlayer = { id: string; alias: string; ready: boolean; team: number };
export type LiveAnswer = { player_id: string; question: number; correct: boolean; choices: number[] };

export const liveCookie = (code: string) => "live-" + code;
export async function liveGuestToken(code: string) {
  const token = (await cookies()).get(liveCookie(code))?.value;
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : undefined;
}

export async function findRoom(key: "id"|"code", value: string, owner?: string) {
  const db = privilegedDatabase();
  let query = db.from("live_rooms").select("*").eq(key,value);
  if (owner) query = query.eq("owner_id",owner);
  const { data:rows, error } = await query.limit(1).overrideTypes<Room[], { merge: false }>();
  check(error,"live_room");
  const data=rows?.[0];
  return data && allowedTeacher(data.owner_id) ? data : null;
}

export async function verifyPlayer(room: Room, token?: string) {
  if (!token) return null;
  const db = privilegedDatabase();
  const { data, error } = await db.from("live_players").select("id,alias,ready,team")
    .eq("room_id",room.id).eq("token_hash",studentCodeHash(token)).maybeSingle().overrideTypes<LivePlayer,{merge:false}>();
  check(error,"live_player");
  if (!data) return null;
  const valid = await db.rpc("live_player_valid",{p_room:room.id,p_player:data.id});
  return valid.data === true ? data : null;
}

export async function roomState(room: Room, player?: LivePlayer): Promise<LiveState> {
  const db = privilegedDatabase();
  let answers = db.from("live_answers").select("player_id,question,correct,choices").eq("room_id",room.id);
  if (player) answers = answers.eq("player_id",player.id);
  const rows: LiveAnswer[] = [];
  for (let offset=0;;offset+=500) {
    const {data,error} = await answers.order("player_id").order("question").range(offset,offset+499)
      .overrideTypes<LiveAnswer[],{merge:false}>();
    check(error,"live_answers");
    rows.push(...(data ?? []));
    if (!data || data.length<500) break;
  }
  const phase = Date.parse(room.expires_at)<=Date.now() ? "ended" : room.phase;
  const index = player && room.pace==="student" ? rows.length : room.question;
  const item = room.items[index];
  const question = item && (phase==="playing" || (!player && phase==="paused"))
    ? liveQuestion(item,await mediaUrls([item],room.owner_id,900)) : undefined;
  const current = rows.filter(row=>row.question===room.question);
  const state: LiveState = {title:room.title, topic:player ? room.guest_topic : room.host_topic,
    phase,pace:room.pace,index,total:room.items.length,ready:player?.ready ?? true,
    answered:!!player && (room.pace==="teacher" ? current.length>0 : !item), own:player ? rows.filter(row=>row.correct).length : 0,question};
  if (!player) {
    const {data,error} = await db.from("live_players").select("id,alias,ready,team").eq("room_id",room.id);
    check(error,"live_roster");
    state.stats = {players:data?.length ?? 0,ready:data?.filter(row=>row.ready).length ?? 0,
      responses:room.pace==="student" ? rows.length : current.length,
      correct:(room.pace==="student" ? rows : current).filter(row=>row.correct).length,
      options:room.pace==="student" ? [] : (room.items[room.question]?.options ?? []).map((_,i)=>current.filter(row=>row.choices.includes(i)).length)};
  }
  return state;
}

export async function createLiveSnapshot(source:{title:string;template:string;items:Item[];activityId?:string|null;lessonId?:string}, form:FormData) {
  const {db,user} = await account(true);
  const valid = liveTemplate.safeParse(source.template);
  const items = valid.success && contentSchema(valid.data).safeParse(source.items);
  const pace = z.enum(["teacher","student"]).safeParse(form.get("pace"));
  const classroom = form.get("classroom") || null;
  if (!valid.success || !items || !items.success || !pace.success || !liveCompatible(valid.data,items.data)) notFound();
  if (classroom !== null) {
    if (!z.uuid().safeParse(classroom).success) notFound();
    const {data,error} = await db.from("classrooms").select("id").eq("id",classroom).eq("owner_id",user.id).is("archived_at",null).maybeSingle();
    check(error,"live_classroom");
    if (!data) notFound();
  }
  const {data,error} = await privilegedDatabase().from("live_rooms").insert({
    owner_id:user.id,classroom_id:classroom,activity_id:source.activityId ?? null,lesson_id:source.lessonId ?? null,
    title:source.title,template:valid.data,items:items.data,pace:pace.data,code:randomBytes(6).toString("hex").toUpperCase(),
    leaderboard:form.has("leaderboard"),teams:form.has("teams"),
  }).select("id").single();
  check(error,"create_live_room");
  redirect(`/live/host/${data!.id}`);
}
