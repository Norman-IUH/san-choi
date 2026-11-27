import Link from "next/link";
import { skills } from "@/lib/game";
import { progressDate, scoreLabels, type ProgressFilters } from "@/lib/classroom-progress";
import type { classroomData } from "@/lib/classroom-server";

type Data = Awaited<ReturnType<typeof classroomData>>;
export const percentLabel = (value: number | null) => value === null ? "—" : `${Math.round(value * 100)}%`;
const points = (value: number | null | undefined, total: number | null | undefined) => value == null ? "—" : `${value}/${total ?? "—"}`;

export function ReportControls({ filters, students }: { filters: ProgressFilters; students?: Data["students"] }) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  const exportUrl = `/classrooms/export?${query}`;
  const path = filters.classroom ? `/classrooms/${filters.classroom}` : `/classrooms/students/${filters.student}`;
  return <details className="panel"><summary>Lọc tiến độ và xuất báo cáo</summary>
    <form className="stack" action={path + "#progress"}><div className="form-grid">
      <label>Kỹ năng<select name="skill" defaultValue={filters.skill ?? ""}>
        <option value="">Tất cả</option>{skills.map(skill => <option key={skill}>{skill}</option>)}</select></label>
      {students && <label>Học sinh<select name="student" defaultValue={filters.student ?? ""}><option value="">Cả lớp</option>
        {Array.from(students.values()).map(row => <option key={row.id} value={row.id}>{row.name} · {row.id.slice(0, 8)}</option>)}</select></label>}
      <label>Ngày giao từ<input type="date" name="from" defaultValue={filters.from}/></label>
      <label>Ngày giao đến<input type="date" name="to" defaultValue={filters.to}/></label>
    </div><button className="button">Áp dụng bộ lọc</button></form>
    <div className="inline-actions">
      <a className="button" href={exportUrl + "&format=xlsx"}>Tải báo cáo Excel</a>
      <a className="button" href={exportUrl + "&format=pdf"}>Tải báo cáo PDF</a>
      {filters.student && <a className="button" href={exportUrl + "&format=pdf&audience=parent"}>Tải PDF cho phụ huynh</a>}
    </div>
  </details>;
}

export function ProgressSummary({ data, individual = false }: { data: Data; individual?: boolean }) {
  const { progress, classroom, students, asOf: now } = data;
  const { table, sources, completed, pending } = progress;
  const open = sources.filter(row => !classroom?.archived_at && !row.closed && (!row.deadline || Date.parse(row.deadline) > now));
  const support = new Map<string, { late: number; review: number }>();
  if (!individual) for (const row of table) {
    const due = row.assignment.deadline;
    const late = !row.latestSubmission && due && Date.parse(due) <= now;
    const answers = row.latestSubmission?.answers;
    const review = Array.isArray(answers) && answers.filter(answer => answer?.correct === false).length >= 3;
    if (!late && !review) continue;
    const count = support.get(row.recipient.student_id) ?? { late: 0, review: 0 };
    if (late) count.late++;
    if (review) count.review++;
    support.set(row.recipient.student_id, count);
  }
  return <section className="stack" id="progress">
    <h2>{individual ? "Tiến độ học tập" : "Tổng quan lớp"}</h2>
    <div className="stats">
      {!individual && <div className="panel"><strong>{data.roster.filter(student => !student.archived_at).length}</strong><p>Học sinh đang hoạt động</p></div>}
      {!individual && <div className="panel"><strong>{open.length}</strong><p>Bài đang mở</p></div>}
      <div className="panel"><strong>{table.length - completed}</strong><p>Bài chưa hoàn thành</p></div>
      <div className="panel"><strong>{pending}</strong><p>Lượt chờ chấm</p></div>
      <div className="panel"><strong>{completed}/{table.length}</strong><p>Đã nộp · {percentLabel(table.length ? completed / table.length : null)}</p></div>
      <div className="panel"><strong>{percentLabel(progress.averageAuto)} / {percentLabel(progress.averageManual)}</strong><p>Trung bình tự động / thủ công</p></div>
    </div>
    {!individual && open.length > 0 && <details className="panel">
      <summary>Xem các bài đang mở</summary>
      <ul className="assignment-list">{open.map(row => <li key={row.id}>
        <Link href={`/assignments/${row.id}`}>{row.title}</Link><span>{row.deadline ? progressDate(row.deadline) : "Không đặt hạn"}</span>
      </li>)}</ul>
    </details>}
    {!individual && support.size > 0 && <section className="panel stack"><h3>Học sinh cần hỗ trợ thêm</h3>
      <ul className="assignment-list">{Array.from(support).map(([id, count]) => <li key={id}>
        <Link href={`/classrooms/students/${id}`}>{students.get(id)?.name ?? id.slice(0, 8)} · {id.slice(0, 8)}</Link>
        <span>{[count.late ? `${count.late} bài quá hạn chưa nộp` : "", count.review ? `${count.review} bài có ít nhất 3 câu sai` : ""].filter(Boolean).join(" · ")}</span></li>)}</ul>
    </section>}
    <section className="panel stack"><h3>Kết quả theo kỹ năng</h3>
      {progress.skills.length || progress.manualSkills.length ? <ul className="assignment-list">
        {progress.skills.map(row => <li key={row.label}><span>{row.label} · Tự động</span><span>{row.correct}/{row.total} câu đúng</span></li>)}
        {progress.manualSkills.map(row => <li key={row.label + "/rubric"}><span>{row.label} · Rubric</span><span>{percentLabel(row.average)} · {row.count} bài có điểm</span></li>)}
      </ul> : <p>Chưa có câu được chấm trong các kỹ năng đã phân loại.</p>}
    </section>
    <section className="panel stack"><h3>{individual ? "Câu cần ôn tập" : "Lỗi phổ biến"}</h3>
      {progress.mistakes.length ? <ul className="assignment-list">{progress.mistakes.slice(0, 12).map((row, index) => <li key={index}>
        <span>{row.prompt} · {row.title}</span><span>{row.wrong}/{row.total} lượt sai</span></li>)}</ul> : <p>Chưa ghi nhận câu sai.</p>}
    </section>
    {individual && <>
      <section className="panel stack"><h3>Tiến bộ theo thời gian</h3>
        {progress.progress.length ? <ol className="stack">{progress.progress.map(({ assignment, attempt, manualMax }) => {
          const manual = attempt.manual_reviews?.state === "pending" ? null : attempt.manual_reviews?.total;
          return <li key={attempt.id}>
            <Link href={`/results/${attempt.id}`}>{assignment} · {progressDate(attempt.completed_at!)}</Link>
            <div>Tự động {points(attempt.score, attempt.total)} {attempt.score !== null && !!attempt.total &&
              <meter min={0} max={attempt.total} value={attempt.score} aria-label="Điểm tự động"/>}</div>
            <div>Thủ công {points(manual, manualMax)} {manual != null && manualMax &&
              <meter min={0} max={manualMax} value={manual} aria-label="Điểm thủ công"/>}</div>
          </li>;
        })}</ol> : <p>Chưa có lượt nộp.</p>}
      </section>
      <section className="panel stack"><h3>Cambridge theo từng Part</h3>
        {progress.parts.length ? <ul className="assignment-list">{progress.parts.map(part => <li key={part.label}>
          <span>{part.label}</span><span>{part.correct}/{part.total} câu tự động{part.open ? ` · ${part.open} mục giáo viên đánh giá` : ""}</span>
        </li>)}</ul> : <p>Chưa có kết quả Cambridge.</p>}
      </section>
      <section className="panel stack"><h3>Từ vựng đã luyện</h3>
        {progress.vocabulary.length ? <ul className="assignment-list">{progress.vocabulary.map(word => <li key={word.label}>
          <span>{word.label}</span><span>{word.seen} lượt luyện · {word.correct}/{word.marked} lượt đúng có chấm</span>
        </li>)}</ul> : <p>Chưa có lượt luyện được gắn kỹ năng từ vựng.</p>}
      </section>
    </>}
    <ProgressHistory data={data} hideStudent={individual}/>
  </section>;
}

export function ProgressHistory({ data, hideStudent = false }: { data: Data; hideStudent?: boolean }) {
  if (!data.progress.table.length) return <p>Chưa có bài giao phù hợp.</p>;
  return <section className="panel stack"><h3>Lịch sử bài giao</h3>
    <div className="table-wrap"><table><thead><tr><th scope="col">Bài giao</th>{!hideStudent && <th scope="col">Học sinh</th>}
      <th scope="col">Trạng thái</th><th scope="col">Lượt làm và điểm</th></tr></thead>
      <tbody>{data.progress.table.map(row => <tr key={row.assignment.id + row.recipient.student_id}>
        <td><Link href={`/assignments/${row.assignment.id}`}>{row.assignment.title}</Link><br/>
          {hideStudent && row.assignment.classrooms && row.assignment.classrooms.name + " · "}{progressDate(row.assignment.created_at)}</td>
        {!hideStudent && <td><Link href={`/classrooms/students/${row.recipient.student_id}`}>{data.students.get(row.recipient.student_id)?.name ?? "Học sinh"}
          {" · "}{row.recipient.student_id.slice(0, 8)}</Link></td>}
        <td>{row.status}</td>
        <td>{row.tries.length ? <ul>{row.tries.map(attempt => {
          const review = attempt.manual_reviews;
          return <li key={attempt.id}>{attempt.completed_at ? <Link href={`/results/${attempt.id}`}>
            {progressDate(attempt.completed_at)} · Tự động {points(attempt.score, attempt.total)} · Thủ công {points(review?.state === "pending" ? null : review?.total, row.manualMax)}
            {review && ` · ${scoreLabels[review.state as keyof typeof scoreLabels] ?? ""}`}</Link> : `${progressDate(attempt.started_at)} · Đang làm`}</li>;
        })}</ul> : "—"}</td>
      </tr>)}</tbody>
    </table></div>
  </section>;
}
