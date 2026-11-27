import "server-only";
import { z } from "zod";
import { account, check } from "./supabase";
import { cambridgePapers } from "./cambridge-papers";
import { cambridgeLevelSchema, starterPaperSchema } from "./games/starters";
import { contentSchema, isTemplate, type Item, type Template } from "./game";
import { lessonPlanSchema, lessonPhases } from "./lesson-plan";
import { lessonActivity } from "./lesson-plan-server";
import { lessonSchema } from "./vocabulary-bank";
import { loadWords } from "./vocabulary-server";
import { canPrint, worksheet, type PaperDocument, type PaperOptions } from "./worksheet";
import transcripts from "./cambridge-transcripts.json";

export type PrintParams = { source: string; id: string };
type Printable = { title: string; owner: string; back: string; transcript: boolean; keys: boolean;
  make: (version: PaperOptions["version"]) => PaperDocument };

export async function printable({ source, id }: PrintParams, query: URLSearchParams): Promise<Printable | null> {
  const { db, user } = await account(true);
  function activity(title: string, template: Template, items: Item[], back: string): Printable | null {
    if (!items.length || !canPrint(template, items)) return null;
    return { title, owner: user.id, back, keys: true, transcript: items.some(item => Boolean(item.practice?.transcript ||
      (item.practice?.starters?.paper === "listening" && item.media?.audio) || item.media?.audio && Object.hasOwn(transcripts, item.media.audio))),
      make: version => worksheet(title, template, items, version, transcripts) };
  }
  if (source === "cambridge") {
    const level = cambridgeLevelSchema.safeParse(id);
    const paper = starterPaperSchema.safeParse(query.get("paper"));
    const part = query.get("part");
    if (!level.success || !paper.success || (part !== null && !/^[1-7]$/.test(part))) return null;
    const sample = cambridgePapers[level.data](paper.data, part === null ? undefined : Number(part));
    return sample ? activity(sample.title, sample.template, sample.items,
      `/samples/cambridge-${level.data}/${paper.data}${part ? `?part=${part}` : ""}`) : null;
  }
  if (!z.uuid().safeParse(id).success) return null;
  if (source === "assignment") {
    const { data, error } = await db.from("assignments").select("title,template,content")
      .eq("id", id).eq("owner_id", user.id).maybeSingle();
    check(error, "print_assignment");
    if (!data || !isTemplate(data.template)) return null;
    const items = contentSchema(data.template).safeParse(data.content);
    return items.success ? activity(data.title, data.template, items.data, `/assignments/${id}`) : null;
  }
  if (source === "activity") {
    const { data, error } = await db.from("activities").select("title,template,content,draft")
      .eq("id", id).eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
    check(error, "print_activity");
    if (!data || !isTemplate(data.template)) return null;
    const items = contentSchema(data.template, data.draft).safeParse(data.content);
    return items.success ? activity(data.title, data.template, items.data, `/activities/${id}`) : null;
  }
  if (source !== "lesson") return null;
  const { data, error } = await db.from("vocabulary_lessons").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle();
  check(error, "print_lesson");
  if (!data) return null;
  const lesson = lessonSchema.parse(data);
  const plan = lessonPlanSchema.safeParse(data.plan).data;
  const [words, steps] = await Promise.all([
    loadWords(db, user.id, lesson.entry_keys),
    Promise.all((plan?.steps ?? []).map(step => lessonActivity(db, user.id, step))),
  ]);
  const doc: PaperDocument = { title: lesson.title, heading: "Giáo án", blocks: [
    { text: [lesson.level, lesson.unit, lesson.topic, lesson.skill].join(" · ") + (plan ? ` · ${plan.minutes} phút` : "") },
    ...(plan?.objectives ? [{ heading: "Mục tiêu", text: plan.objectives }] : []),
    ...(plan?.steps ?? []).map((step, i) => ({ heading: `${i + 1}. ${lessonPhases[step.phase]} · ${step.minutes} phút`,
      text: steps[i]?.title ?? "Hoạt động hiện không khả dụng." })),
    ...(plan?.notes ? [{ heading: "Ghi chú của giáo viên", text: plan.notes }] : []),
    ...(plan?.homework ? [{ heading: "Bài về nhà", text: plan.homework }] : []),
    ...(words.length ? [{ heading: "Từ vựng" }, ...words.map(word => ({ heading: word.word, text: [word.meaning, word.ipa, word.example].filter(Boolean).join("\n") }))] : []),
  ] };
  return { title: lesson.title, owner: user.id, back: `/library/${id}`, transcript: false, keys: false, make: () => doc };
}
