import Link from "next/link";
import { LessonPlanEditor } from "@/components/LessonPlanEditor";
import { AssignmentForm } from "@/components/AssignmentForm";
import { Player } from "@/components/Player";
import { contentSchema } from "@/lib/game";
import { emptyPlan, lessonPhases, type LessonDetails, type LessonPlan, type LessonStep } from "@/lib/lesson-plan";
import { samplePlan, sampleStep } from "@/lib/lesson-plan-samples";
import { lessonActivity } from "@/lib/lesson-plan-server";
import { localPlay } from "@/lib/local-play";
import { mediaUrls } from "@/lib/media-server";
import { check, type database } from "@/lib/supabase";
import { assignLessonStep, duplicatePlan } from "../plan-actions";
import { hostLesson } from "@/app/live/actions";
import { LiveRoomForm } from "@/components/LiveRoomForm";
import { liveCompatible } from "@/lib/live";

type Database = Awaited<ReturnType<typeof database>>;
export type LessonQuery = { game?: string; problem?: string; mode?: string; step?: string; sample?: string; saved?: string; omitted?: string };

export async function PlanEdit({ db, owner, id, sample, initial, startingPlan }: { db: Database; owner: string; id: string | null;
  sample?: string; initial?: LessonDetails; startingPlan?: LessonPlan }) {
  const preset = sample && samplePlan(sample);
  const initialDetails: LessonDetails = initial ?? (preset ? preset.lesson : { title: "", level: "Kids", topic: "", unit: "", skill: "Vocabulary" });
  const phases = ["warmup", "presentation", "practice", "game", "homework"] as const;
  const plan: LessonPlan = startingPlan ?? (preset ? { ...emptyPlan, objectives: preset.objectives, homework: preset.homework,
    steps: preset.activities.map((_, index) => ({ id: crypto.randomUUID(), kind: "sample", phase: phases[index],
      source: `${sample}/${index}`, minutes: [5, 7, 8, 10, 5][index] })) } : emptyPlan);
  const { data, error } = await db.from("activities").select("id,title,draft").eq("owner_id", owner).is("deleted_at", null).order("title");
  check(error, "list_activities_for_plan");
  const sampleTitles = Object.fromEntries(plan.steps.flatMap(step => step.kind === "sample" ? [[step.source, sampleStep(step.source)?.title ?? "Hoạt động mẫu không khả dụng"]] : []));
  return <div className="narrow wide stack bank-page">
    <Link className="back" href={id ? `/library/${id}` : "/library"}>← {id ? "Giáo án" : "Thư viện tiếng Anh"}</Link>
    <h1>{id ? "Sửa giáo án" : "Tạo giáo án"}</h1>
    {id && <div className="inline-actions"><Link className="button" href={`/teaching/print/lesson/${id}`}>In giáo án đã lưu</Link></div>}
    <LessonPlanEditor id={id} sample={sample ?? null} initial={{ title: initialDetails.title, level: initialDetails.level,
      skill: initialDetails.skill, topic: initialDetails.topic, unit: initialDetails.unit }} startingPlan={plan} activities={data ?? []} sampleTitles={sampleTitles}/>
  </div>;
}

export async function PlanView({ db, owner, id, plan, lesson, query }: { db: Database; owner: string; id: string; plan: LessonPlan;
  lesson: LessonDetails; query: LessonQuery }) {
  const presenting = query.mode === "present";
  const selected = plan.steps.find(step => step.id === query.step) ?? plan.steps[0];
  const index = plan.steps.findIndex(step => step.id === selected?.id);
  const stepHref = (step: LessonStep, mode = presenting) => `/library/${id}?step=${step.id}${mode ? "&mode=present" : ""}#lesson-stage`;
  const ids = [...new Set(plan.steps.flatMap(step => step.kind === "activity" ? [step.source] : []))];
  const [activity, choices, assignments] = await Promise.all([
    selected ? lessonActivity(db, owner, selected) : null,
    !presenting && ids.length ? db.from("activities").select("id,title").eq("owner_id", owner).is("deleted_at", null).in("id", ids) : null,
    !presenting && selected ? db.from("assignments").select("id,title,closed").eq("lesson_id", id).eq("lesson_step", selected.id)
      .eq("owner_id", owner).order("created_at", { ascending: false }).limit(100) : null,
  ]);
  check(choices?.error ?? null, "lesson_step_titles");
  check(assignments?.error ?? null, "lesson_step_assignments");
  const titles = new Map(choices?.data?.map(row => [row.id, row.title]));
  const playable = activity && contentSchema(activity.template).safeParse(activity.items).success;
  const assets = playable ? await mediaUrls(activity.items, owner) : {};
  const navigator = <nav className="lesson-navigator inline-actions" aria-label="Điều hướng hoạt động">
    {index > 0 && <Link className="button" href={stepHref(plan.steps[index - 1])}>← Hoạt động trước</Link>}
    {selected && <span>{index + 1} / {plan.steps.length} · {lessonPhases[selected.phase]} · {selected.minutes} phút</span>}
    {index + 1 < plan.steps.length && <Link className="button" href={stepHref(plan.steps[index + 1])}>Hoạt động tiếp theo →</Link>}
  </nav>;
  return <section className="stack lesson-plan" id="lesson-stage">
    {presenting ? <div className="section-head"><h1>{lesson.title}</h1>
      {selected && <Link className="button" href={stepHref(selected, false)}>Thoát trình chiếu</Link>}</div> : <>
      <div className="section-head"><h2>Tiến trình giáo án</h2><div className="inline-actions">
        <Link className="button" href={`/library/${id}?mode=edit`}>Sửa giáo án</Link>
        <Link className="button" href={`/teaching/print/lesson/${id}`}>In giáo án</Link>
        <form action={duplicatePlan.bind(null, id)}><button className="button">Nhân bản giáo án</button></form>
        {selected && <Link className="button primary" href={stepHref(selected, true)}>Trình chiếu</Link>}
      </div></div>
      <p className="muted">{plan.minutes} phút trên lớp{plan.draft ? " · Bản nháp" : ""}</p>
      {plan.objectives && <div className="lesson-objectives"><strong>Mục tiêu học tập</strong><p>{plan.objectives}</p></div>}
      {plan.steps.length ? <ol className="lesson-outline" aria-label="Tiến trình giáo án">{plan.steps.map(step => <li key={step.id}>
        <Link href={stepHref(step)} aria-current={step.id === selected?.id ? "step" : undefined}>
          <small>{lessonPhases[step.phase]} · {step.minutes} phút</small>
          <strong>{step.kind === "sample" ? sampleStep(step.source)?.title : titles.get(step.source) ?? "Hoạt động không khả dụng"}</strong>
        </Link>
      </li>)}</ol> : <p>Thêm hoạt động để xem trước và trình chiếu.</p>}
    </>}
    {navigator}
    {playable ? <Player key={selected.id} title={activity.title}
      mediaScope={activity.activityId ? { source: "activity", id: activity.activityId } : undefined}
      {...localPlay(activity.template, activity.items, assets)}/>
      : selected && <p className="notice">Hoạt động chưa có nội dung dùng được. {activity?.activityId && <Link href={`/activities/${activity.activityId}?edit=1`}>Mở trình soạn</Link>}</p>}
    {!presenting && selected && <>
      {query.problem === "deadline" && <p role="alert" className="notice error">Hạn nộp phải ở tương lai.</p>}
      {plan.draft && <p className="notice">Lưu giáo án ở trạng thái sẵn sàng để giao hoạt động.</p>}
      {playable && !plan.draft && !activity.draft && <details className="panel" key={selected.id}><summary>Giao hoạt động này · {activity.title}</summary>
        <AssignmentForm action={assignLessonStep.bind(null, id, selected.id)}/></details>}
      {playable && !plan.draft && !activity.draft && liveCompatible(activity.template,activity.items) &&
        <LiveRoomForm action={hostLesson.bind(null,id,selected.id)}/>}
      <section className="panel stack"><h3>Kết quả hoạt động</h3>
        {assignments?.data?.length ? <ul className="bank-lesson-list">
          {assignments.data.map(row => <li key={row.id}>
            <Link href={`/assignments/${row.id}`}>{row.title}</Link><span>{row.closed ? "Đã đóng" : "Đang mở"}</span></li>)}</ul>
          : <p>Chưa có bài giao từ bước này.</p>}
      </section>
    </>}
    {plan.homework && <div className="lesson-objectives"><strong>Bài tập về nhà</strong><p>{plan.homework}</p></div>}
  </section>;
}
