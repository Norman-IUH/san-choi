import { classroomLevels, type Classroom } from "@/lib/classroom";

export function ClassroomFields({ record }: { record?: Classroom }) {
  return <>
    <div className="form-grid">
      <label>Tên lớp<input name="name" maxLength={120} required defaultValue={record?.name}/></label>
      <label>Cấp độ<select name="level" defaultValue={record?.level}>{classroomLevels.map(level => <option key={level}>{level}</option>)}</select></label>
      <label>Lịch học<input name="schedule" maxLength={160} defaultValue={record?.schedule}/></label>
      <label>Khóa học<input name="course" maxLength={120} defaultValue={record?.course}/></label>
    </div>
    <label>Ghi chú lớp<textarea name="notes" rows={3} maxLength={2000} defaultValue={record?.notes}/></label>
  </>;
}
