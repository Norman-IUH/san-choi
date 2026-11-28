import { z } from "zod";
import { normalize, type Item } from "./games/model";
import { grade } from "./games/scoring";

export const liveTemplates = ["quiz", "gameshow", "true-false", "image-quiz"] as const;
export const liveTemplate = z.enum(liveTemplates);
export const liveCode = z.string().trim().toUpperCase().regex(/^[A-F0-9]{12}$/);
export const liveCommands = z.enum(["start","pause","resume","next","end","ranking"]);
export type LiveCommand = z.infer<typeof liveCommands>;
export function liveCompatible(template: string, items: Item[]) {
  return liveTemplate.safeParse(template).success && items.length > 0 && items.every(item => !item.practice);
}

export function liveGrade(template: typeof liveTemplates[number], item: Item, choices: number[]) {
  if (!choices.length || new Set(choices).size !== choices.length ||
      choices.some(index => !Number.isInteger(index) || !item.options[index])) return null;
  return grade(template, [item], [choices.map(index => item.options[index])]).correct[0];
}

export function liveQuestion(item: Item, assets: Record<string,string>) {
  const media = (path?: string) => path ? assets[path] : undefined;
  return { prompt: item.prompt, multi: item.answers.length > 1,
    image: media(item.media?.image), audio: media(item.media?.audio),
    choices: item.options.map(label => {
      const option = item.optionMedia?.find(row => normalize(row.option) === normalize(label));
      return { label, image: media(option?.image), audio: media(option?.audio) };
    }) };
}

export type RankingEntry={label:string;points:number;best?:number;bonus?:number;rank:number};
export function topRanks(rows: Omit<RankingEntry,"rank">[]):RankingEntry[] {
  const ordered=rows.filter(row=>row.points>0).sort((a,b)=>b.points-a.points || a.label.localeCompare(b.label,"vi"));
  let rank=0;
  return ordered.slice(0,3).map((row,index)=>{
    if (index===0 || ordered[index-1].points!==row.points) rank=index+1;
    return {...row,rank};
  });
}

export function livePoints(answers:{question:number;correct:boolean}[]) {
  let points=0,best=0,streak=0,bonus=0,previous=-1;
  for(const answer of [...answers].sort((a,b)=>a.question-b.question)) {
    if(answer.question!==previous+1) streak=0;
    previous=answer.question;
    streak=answer.correct ? streak+1 : 0;
    if(!streak) continue;
    points++;
    if(streak%3===0) {points++;bonus++;}
    best=Math.max(best,streak);
  }
  return {points,best,bonus};
}

export type LiveState = {
  title: string; topic: string; phase: "lobby"|"playing"|"paused"|"ended"; pace: "teacher"|"student";
  index: number; total: number; ready: boolean; answered: boolean; own: number;
  question?: ReturnType<typeof liveQuestion>;
  rankingEnabled?:boolean; team?:number; ranking?:RankingEntry[]; celebration?:number;
  stats?: { players:number; ready:number; responses:number; correct:number; options:number[];
    questions:{responses:number;correct:number}[] };
};
