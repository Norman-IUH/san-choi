"use server";

import {redirect} from "next/navigation";
import {account,check} from "@/lib/supabase";
import {generatorSchema,generateBankActivity,generateTextActivity,parseGeneratorWords} from "@/lib/activity-generator";
import {compatible,contentSchema,normalize} from "@/lib/game";
import {itemMediaPaths} from "@/lib/media";
import {lessonActivity} from "@/lib/lesson-plan-server";
import {lessonPlanSchema} from "@/lib/lesson-plan";
import {lessonSchema} from "@/lib/vocabulary-bank";
import {listBankWords,loadWords} from "@/lib/vocabulary-server";
import {vocabularyCatalog} from "@/lib/vocabulary-catalog";

export async function generateActivity(_state:{error:string},form:FormData) {
  const {db,user}=await account(true);
  const parsed=generatorSchema.safeParse(Object.fromEntries(form));
  if(!parsed.success) return {error:"Kiểm tra nguồn, cấp độ, mẫu và số câu từ 1 đến 20."};
  const input=parsed.data;
  let items=null;
  if(input.source==="topic" || input.source==="words") {
    const bank=[...(await listBankWords(db,user.id)),...vocabularyCatalog];
    const words=input.source==="words" ? parseGeneratorWords(input,bank) : bank.filter(row=>
      input.topic && normalize(row.topic).includes(normalize(input.topic)));
    if(words) items=generateBankActivity(input,words);
  } else if(input.source==="lesson" && input.lesson) {
    const {data,error}=await db.from("vocabulary_lessons").select("*").eq("id",input.lesson).eq("owner_id",user.id).maybeSingle();
    check(error,"generate_from_lesson");
    const lesson=lessonSchema.safeParse(data).data;
    if(lesson) items=generateBankActivity(input,await loadWords(db,user.id,lesson.entry_keys));
    const plan=lessonPlanSchema.safeParse(data?.plan).data;
    if(!items && plan) {
      const parts=await Promise.all(plan.steps.map(step=>lessonActivity(db,user.id,step)));
      const compatibleItems=parts.flatMap(activity=>activity && !activity.draft && compatible(activity.template,input.template,activity.items)
        ? activity.items.filter(item=>item.english?.skill===input.skill && item.english.level===input.level) : []);
      const content=compatibleItems.slice(0,input.count);
      if(content.length===input.count) items=contentSchema(input.template).safeParse(content).data ?? null;
      if(!items && lesson?.level===input.level) items=generateTextActivity(input,plan.objectives);
    }
  } else if(input.source==="passage" || input.source==="text") items=generateTextActivity(input,input.body);
  if(!items || itemMediaPaths(items).some(path=>!path.startsWith(user.id+"/"))) {
    return {error:"Nguồn chưa đủ câu phù hợp. Hãy giảm số câu hoặc chọn nguồn, kỹ năng và mẫu khác."};
  }
  const {data,error}=await db.from("activities").insert({title:input.title,subject:"English",grade:input.level,
    tags:input.skill,template:input.template,content:items,draft:true,visibility:"private"}).select("id").single();
  check(error,"generate_activity");
  redirect(`/activities/${data!.id}?edit=1&saved=1`);
}
