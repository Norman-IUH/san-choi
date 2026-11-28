import "server-only";
import {cache} from "react";
import {allowedTeacher,check,privilegedDatabase} from "./supabase";

export const publicActivity=cache(async(id:string,embed=false)=>{
  const db=privilegedDatabase();
  let query=db.from("activities").select("title,description,template,content,visibility,owner_id")
    .eq("id",id).eq("draft",false).is("deleted_at",null);
  query=embed ? query.eq("visibility","public") : query.in("visibility",["public","unlisted"]);
  const {data,error}=await query.maybeSingle();
  check(error,"public_activity");
  return data && allowedTeacher(data.owner_id) ? data : null;
});
