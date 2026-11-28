import {z} from "zod";
import {contentSchema,levels,normalize,templates,type Item} from "./game";
import {bankWordSchema,vocabularyGame,type BankWord} from "./vocabulary-bank";
import {difficultyLevels} from "./games/arcade-templates";

export const generatorTemplates=["quiz","gameshow","true-false","image-quiz","match-up","flash-cards","type-answer","sentence"] as const;
export const generatorSkills=["Vocabulary","Reading","Grammar","Writing"] as const;
export const generatorSchema=z.object({
  source:z.enum(["topic","words","passage","lesson","text"]),
  title:z.string().trim().min(1).max(120), level:z.enum(levels), skill:z.enum(generatorSkills),
  difficulty:z.enum(difficultyLevels), template:z.enum(generatorTemplates),count:z.coerce.number().int().min(1).max(20),
  topic:z.string().trim().max(80),body:z.string().trim().max(3500),lesson:z.union([z.uuid(),z.literal("")]),
});
export type GeneratorInput=z.infer<typeof generatorSchema>;
const width={gentle:2,steady:3,challenge:4};
const spelling=/[\p{L}][\p{L}\p{M}'’-]{2,24}/gu;

export function parseGeneratorWords(input:GeneratorInput,bank:BankWord[]) {
  const rows=input.body.split(/\r?\n/).map(row=>row.trim()).filter(Boolean);
  if(!rows.length || rows.length>60) return null;
  const known=new Map(bank.filter(row=>row.level===input.level).map(row=>[normalize(row.word),row]));
  const words:BankWord[]=[];
  for(const [index,row] of rows.entries()) {
    const fields=row.split("|").map(field=>field.trim());
    const match=known.get(normalize(fields[0]));
    if(fields.length===1 && match) {words.push(match);continue;}
    const parsed=bankWordSchema.safeParse({word:fields[0],meaning:fields[1],level:input.level,topic:input.topic || "Từ nhập"});
    if(fields.length!==2 || !parsed.success) return null;
    words.push({...parsed.data,id:String(index)});
  }
  return words;
}

export function generateBankActivity(input:GeneratorInput,values:BankWord[]) {
  if(input.skill!=="Vocabulary") return null;
  const words=[...new Map(values.filter(row=>!row.archived_at && row.level===input.level &&
    (input.template!=="image-quiz" || !!row.image)).map(row=>[normalize(row.word),row])).values()];
  if(words.length<input.count) return null;
  const all=vocabularyGame(input.template,words.slice(0,60),input.skill,input.difficulty);
  if(!all || all.length<input.count) return null;
  const items=all.slice(0,input.count).map((item,index)=>{
    if(!["quiz","gameshow","image-quiz"].includes(input.template)) return item;
    const choices=item.options.slice(0,width[input.difficulty]);
    const shift=index%choices.length;
    const options=[...choices.slice(shift),...choices.slice(0,shift)];
    return {...item,options,optionMedia:item.optionMedia?.filter(media=>options.includes(media.option))};
  });
  return contentSchema(input.template).safeParse(items).data ?? null;
}

export function generateTextActivity(input:GeneratorInput,text:string) {
  const kind=templates[input.template].kind;
  if(input.skill==="Vocabulary" || !["quiz","gameshow","type-answer","sentence"].includes(input.template)) return null;
  const sentences=text.split(/(?<=[.!?])\s+|\n+/u).map(value=>value.trim()).filter(value=>value.length>=12 && value.length<=360);
  const tokens=sentences.flatMap(sentence=>Array.from(sentence.matchAll(spelling)).map(match=>({sentence,word:match[0],index:match.index})));
  const pool=[...new Set(tokens.map(token=>normalize(token.word)))];
  const candidates=tokens.filter(token=>token.word.length>=(input.difficulty==="challenge" ? 5 : 3));
  const selected=[...new Map(candidates.map(token=>[normalize(token.word),token])).values()].slice(0,input.count);
  if(selected.length<input.count || (kind==="choice" && pool.length<width[input.difficulty])) return null;
  const items=selected.map(({sentence,word,index},ordinal):Item=>{
    const answer=normalize(word);
    const choices=kind==="choice" ? [answer,...pool.filter(option=>option!==answer).slice(0,width[input.difficulty]-1)] : [];
    const shift=choices.length ? ordinal%choices.length : 0;
    return {version:2,prompt:sentence.slice(0,index)+"___"+sentence.slice(index+word.length),answers:[answer],
      options:[...choices.slice(shift),...choices.slice(0,shift)],english:{level:input.level,skill:input.skill}};
  });
  return contentSchema(input.template).safeParse(items).data ?? null;
}
