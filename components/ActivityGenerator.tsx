"use client";

import {useActionState,useState} from "react";
import {generateActivity} from "@/app/activities/generate/actions";
import {generatorSkills,generatorTemplates} from "@/lib/activity-generator";
import {levels,templates} from "@/lib/game";
import {difficultyLabels} from "@/lib/vocabulary-bank";

export function ActivityGenerator({lessons,topics}:{lessons:{id:string;title:string}[];topics:string[]}) {
  const [source,setSource]=useState("topic");
  const [skill,setSkill]=useState("Vocabulary");
  const [template,setTemplate]=useState("quiz");
  const [state,action,pending]=useActionState(generateActivity,{error:""});
  const allowed=generatorTemplates.filter(value=>skill==="Vocabulary" || ["quiz","gameshow","type-answer","sentence"].includes(value));
  return <form action={action} className="panel stack">
    <div className="form-grid">
      <label>Tên bản nháp<input required name="title" maxLength={120}/></label>
      <label>Nguồn nội dung<select name="source" value={source} onChange={event=>{
        const next=event.target.value;
        setSource(next);
        setSkill(next==="passage" || next==="text" ? "Reading" : "Vocabulary");
        setTemplate("quiz");
      }}>
        <option value="topic">Chủ đề trong kho từ</option><option value="words">Danh sách từ vựng</option>
        <option value="passage">Đoạn văn</option><option value="lesson">Giáo án đã lưu</option><option value="text">Văn bản nhập tay</option>
      </select></label>
      <label>Cấp độ<select name="level">{levels.map(level=><option key={level}>{level}</option>)}</select></label>
      <label>Kỹ năng<select name="skill" value={skill} onChange={event=>{setSkill(event.target.value);setTemplate("quiz");}}>
        {generatorSkills.filter(value=>source==="topic" || source==="words" ? value==="Vocabulary" :
          source==="lesson" || value!=="Vocabulary").map(value=><option key={value}>{value}</option>)}
      </select></label>
      <label>Độ khó<select name="difficulty" defaultValue="steady">{Object.entries(difficultyLabels)
        .map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <label>Mẫu trò chơi<select name="template" value={template} onChange={event=>setTemplate(event.target.value)}>
        {allowed.map(value=><option key={value} value={value}>{templates[value].title}</option>)}</select></label>
      <label>Số câu<input name="count" type="number" min={1} max={20} defaultValue={5} required/></label>
    </div>
    {source==="topic" ? <label>Chủ đề<input name="topic" list="generator-topics" maxLength={80} required/>
      <datalist id="generator-topics">{topics.map(topic=><option key={topic} value={topic}/>)}</datalist></label> : <input type="hidden" name="topic" value=""/>}
    {source==="lesson" ? <label>Giáo án<select name="lesson" required><option value="">Chọn giáo án</option>
      {lessons.map(lesson=><option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></label> :
      <input type="hidden" name="lesson" value=""/>}
    {["words","passage","text"].includes(source) ?
      <label>{source==="words" ? "Mỗi dòng một từ, hoặc từ | nghĩa" : "Nội dung tiếng Anh"}
        <textarea name="body" required maxLength={3500} rows={7}/></label> : <input type="hidden" name="body" value=""/>}
    <p>Kho từ dùng kỹ năng Vocabulary. Đoạn văn và văn bản tạo câu điền từ cho Reading, Grammar hoặc Writing.</p>
    {state.error && <p role="alert" className="notice error">{state.error}</p>}
    <button className="button primary" disabled={pending}>Tạo bản nháp để duyệt</button>
  </form>;
}
