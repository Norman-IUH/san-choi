"use client";
import { useActionState, useState } from "react";
import { saveManualReview } from "@/app/results/review-actions";
import type { Rubric } from "@/lib/games/productive";

export function AssessmentForm({ id, rubric, review }: { id: string; rubric: Rubric;
  review: { revision: number; scores: (number | null)[]; feedback: string; state: string } }) {
  const [problem, submit, pending] = useActionState(saveManualReview.bind(null, id, review.revision), "");
  const [scores, setScores] = useState(() => rubric.map((_, index) => review.scores[index]?.toString() ?? ""));
  const [feedback, setFeedback] = useState(review.feedback);
  const complete = scores.every(value => value !== "");
  const total = scores.reduce((sum, value) => sum + Number(value), 0);
  return <form action={submit} className="panel stack assessment-panel" data-review-revision={review.revision}>
    <h2>Đánh giá theo rubric</h2>
    <p className="muted">Tiêu chí nội bộ của giáo viên.</p>
    {rubric.map((criterion, index) => <div className="form-grid" key={criterion.title}>
      <div><strong>{criterion.title}</strong><p>{criterion.description}</p></div>
      <label>Điểm {criterion.title} / {criterion.max}<input name={`criterion-${index}`} type="number" min={0} max={criterion.max} step={1}
        value={scores[index]} onChange={event => {
          const value = event.target.value;
          setScores(previous => previous.map((score, position) => position === index ? value : score));
        }}/></label>
    </div>)}
    <p role="status">{complete ? `${total}/${rubric.reduce((sum, criterion) => sum + criterion.max, 0)} điểm` : "Đang chấm"}</p>
    <label>Nhận xét của giáo viên<textarea name="feedback" rows={6} maxLength={4000} value={feedback} onChange={event => setFeedback(event.target.value)}/></label>
    {review.state === "published" && <p className="hint">Lưu nháp bản sửa sẽ ẩn phần nhận xét cho tới lần công bố tiếp theo.</p>}
    {problem && <p role="alert" className="notice error">{problem}</p>}
    <div className="inline-actions"><button className="button" name="intent" value="save" disabled={pending}>Lưu đánh giá</button>
      <button className="button primary" name="intent" value="publish" disabled={pending || !complete}>Công bố kết quả</button></div>
  </form>;
}
