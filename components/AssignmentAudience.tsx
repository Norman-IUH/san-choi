"use client";

import { useState } from "react";

export function AssignmentAudience({ classrooms }: { classrooms: { id: string; name: string; students: { id: string; name: string }[] }[] }) {
  const [classroom, setClassroom] = useState("");
  const [audience, setAudience] = useState("all");
  const selected = classrooms.find(row => row.id === classroom);
  return <>
    {!!classrooms.length && <label>Giao cho<select name="classroom" value={classroom} onChange={event => {
      setClassroom(event.target.value); setAudience("all");
    }}><option value="">Ai có đường dẫn</option>{classrooms.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>}
    {!selected && <label className="check"><input type="checkbox" name="require_name" defaultChecked/> Yêu cầu biệt danh</label>}
    {selected && <>
      <div className="form-grid">
        <label>Người nhận<select name="audience" value={audience} onChange={event => setAudience(event.target.value)}>
          <option value="all">Cả lớp</option><option value="selected">Học sinh được chọn</option></select></label>
        <label>Số lượt làm tối đa<input type="number" name="attempt_cap" min={1} max={20} defaultValue={1} required/></label>
      </div>
      <p>Học sinh dùng mã cá nhân để bắt đầu bài.</p>
      {audience === "selected" && <fieldset key={classroom}><legend>Học sinh được giao bài</legend>
        {!selected.students.length && <p>Lớp chưa có học sinh đang hoạt động.</p>}
        {selected.students.map(student => <label className="check" key={student.id}>
          <input type="checkbox" name="recipient" value={student.id}/>{student.name} · {student.id.slice(0, 8)}
        </label>)}
      </fieldset>}
    </>}
  </>;
}
