export function AssignmentForm({ action }: { action: (form: FormData) => Promise<void> }) {
  return <form action={action} className="stack">
    <label>Hạn nộp (giờ Việt Nam)<input name="deadline" type="datetime-local"/></label>
    <label className="check"><input type="checkbox" name="require_name" defaultChecked/> Yêu cầu biệt danh</label>
    <label className="check"><input type="checkbox" name="show_score" defaultChecked/> Cho học sinh xem điểm</label>
    <label className="check"><input type="checkbox" name="show_review"/> Cho học sinh xem câu sai và đáp án sau khi nộp</label>
    <button className="button primary">Tạo link giao bài</button>
  </form>;
}
