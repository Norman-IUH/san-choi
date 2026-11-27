"use client";
import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { savePlan } from "@/app/library/plan-actions";
import { levels, skills } from "@/lib/game";
import { lessonPhases, type LessonDetails, type LessonPlan } from "@/lib/lesson-plan";

export function LessonPlanEditor({ id, sample, initial, startingPlan, activities, sampleTitles }: {
  id: string | null; sample: string | null; initial: LessonDetails; startingPlan: LessonPlan;
  activities: { id: string; title: string; draft: boolean }[]; sampleTitles: Record<string, string>;
}) {
  const [plan, setPlan] = useState(startingPlan);
  const [details, setDetails] = useState(initial);
  const [selected, setSelected] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [problem, submit, pending] = useActionState(savePlan.bind(null, id, sample), "");
  const titles = new Map(activities.map(activity => [activity.id, activity.title]));
  function move(id: string, destination: number) {
    const from = plan.steps.findIndex(step => step.id === id);
    if (from < 0 || destination < 0 || destination >= plan.steps.length || from === destination) return;
    const steps = [...plan.steps];
    const [step] = steps.splice(from, 1);
    steps.splice(destination, 0, step);
    setPlan({ ...plan, steps });
    setAnnouncement(`Đã chuyển hoạt động ${from + 1} đến vị trí ${destination + 1}.`);
  }
  return <form action={submit} className="stack lesson-editor">
    <div className="panel stack"><h2>Thông tin giáo án</h2>
      <label>Tên giáo án<input name="title" maxLength={100} required value={details.title} onChange={event => setDetails({ ...details, title: event.target.value })}/></label>
      <div className="form-grid">
        <label>Cấp độ<select name="level" value={details.level} onChange={event => setDetails({ ...details, level: event.target.value as LessonDetails["level"] })}>
          {levels.map(level => <option key={level}>{level}</option>)}</select></label>
        <label>Kỹ năng<select name="skill" value={details.skill} onChange={event => setDetails({ ...details, skill: event.target.value as LessonDetails["skill"] })}>
          {skills.map(skill => <option key={skill}>{skill}</option>)}</select></label>
        <label>Chủ đề<input name="topic" maxLength={80} required value={details.topic} onChange={event => setDetails({ ...details, topic: event.target.value })}/></label>
        <label>Unit<input name="unit" maxLength={80} required value={details.unit} onChange={event => setDetails({ ...details, unit: event.target.value })}/></label>
        <label>Thời lượng lớp (phút)<input name="minutes" type="number" required min={1} max={240} value={plan.minutes || ""}
          onChange={event => setPlan({ ...plan, minutes: Number(event.target.value) })}/></label>
      </div>
      <label>Mục tiêu học tập<textarea name="objectives" maxLength={1200} value={plan.objectives} onChange={event => setPlan({ ...plan, objectives: event.target.value })}/></label>
      <label>Ghi chú riêng của giáo viên<textarea name="notes" maxLength={2400} value={plan.notes} onChange={event => setPlan({ ...plan, notes: event.target.value })}/></label>
    </div>
    <section className="panel stack"><div className="section-head"><h2>Thứ tự hoạt động</h2>
      <span className="muted">{plan.steps.reduce((sum, step) => sum + (step.phase === "homework" ? 0 : step.minutes), 0)} / {plan.minutes} phút trên lớp</span></div>
      <p className="sr-only" role="status">{announcement}</p>
      <ol className="stack lesson-timeline">{plan.steps.map((step, index) => <li key={step.id} onDragOver={event => event.preventDefault()}
        onDrop={event => { event.preventDefault(); move(event.dataTransfer.getData("application/x-sanchoi-step"), index); }}>
        <div className="lesson-step-head">
          <span draggable className="lesson-drag" title="Kéo để đổi thứ tự" onDragStart={event => {
            event.dataTransfer.setData("application/x-sanchoi-step", step.id);
            event.dataTransfer.effectAllowed = "move";
          }}><GripVertical size={18} aria-hidden="true"/></span>
          <strong>{step.kind === "sample" ? sampleTitles[step.source] : titles.get(step.source) ?? "Hoạt động không khả dụng"}</strong>
          <div className="inline-actions">
            <button type="button" className="icon-button" aria-label={`Đưa hoạt động ${index + 1} lên`} disabled={index === 0}
              onClick={() => move(step.id, index - 1)}><ArrowUp size={16}/></button>
            <button type="button" className="icon-button" aria-label={`Đưa hoạt động ${index + 1} xuống`} disabled={index === plan.steps.length - 1}
              onClick={() => move(step.id, index + 1)}><ArrowDown size={16}/></button>
            <button type="button" className="icon-button" aria-label={`Bỏ hoạt động ${index + 1}`}
              onClick={() => setPlan({ ...plan, steps: plan.steps.filter(row => row.id !== step.id) })}><Trash2 size={16}/></button>
          </div>
        </div>
        <div className="form-grid"><label>Giai đoạn<select value={step.phase} onChange={event => {
          const phase = event.target.value as typeof step.phase;
          setPlan({ ...plan, steps: plan.steps.map(row => row.id === step.id ? { ...row, phase } : row) });
        }}>{Object.entries(lessonPhases).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
          <label>Số phút<input type="number" required min={1} max={120} value={step.minutes || ""} onChange={event => {
            const minutes = Number(event.target.value);
            setPlan({ ...plan, steps: plan.steps.map(row => row.id === step.id ? { ...row, minutes } : row) });
          }}/></label></div>
      </li>)}</ol>
      <div className="inline-actions"><label>Hoạt động từ thư viện<select value={selected} onChange={event => setSelected(event.target.value)}>
        <option value="">Chọn hoạt động</option>{activities.map(row => <option value={row.id} key={row.id}>{row.title}{row.draft ? " · Bản nháp" : ""}</option>)}
      </select></label><button type="button" className="button" disabled={!selected || plan.steps.length >= 30} onClick={() => {
        setPlan({ ...plan, steps: [...plan.steps, { id: crypto.randomUUID(), kind: "activity", source: selected, phase: "practice", minutes: 5 }] });
        setSelected("");
      }}><Plus size={17}/> Thêm hoạt động</button></div>
    </section>
    <label className="panel">Bài tập về nhà<textarea name="homework" maxLength={1200} value={plan.homework} onChange={event => setPlan({ ...plan, homework: event.target.value })}/></label>
    <input type="hidden" name="steps" value={JSON.stringify(plan.steps)}/>
    {problem && <p className="notice error" role="alert">{problem}</p>}
    <div className="inline-actions"><button className="button primary" name="status" value="ready" disabled={pending}>Lưu giáo án</button>
      <button className="button" name="status" value="draft" disabled={pending}>Lưu nháp giáo án</button></div>
  </form>;
}
