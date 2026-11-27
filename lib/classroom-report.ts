import writeXlsxFile, { type Cell } from "write-excel-file/node";
import { literalSheet } from "./xlsx";
import { progressDate, scoreLabels, type ProgressFilters } from "./classroom-progress";
import type { classroomData } from "./classroom-server";
import type { PaperDocument } from "./worksheet";

type Data = Awaited<ReturnType<typeof classroomData>>;

function reportRows({ progress, students }: Data) {
  return progress.table.flatMap(row => {
    const id = row.recipient.student_id;
    const base = [students.get(id)?.name ?? "Học sinh", id, row.assignment.title, row.status];
    return row.tries.length ? row.tries.map(attempt => {
      const review = attempt.manual_reviews;
      return [...base, attempt.id, progressDate(attempt.started_at), attempt.completed_at ? progressDate(attempt.completed_at) : null,
        attempt.score, attempt.score === null ? null : attempt.total, review?.state !== "pending" ? review?.total ?? null : null,
        row.manualMax, review ? scoreLabels[review.state as keyof typeof scoreLabels] ?? null : null, row.assignment.classrooms?.name ?? null];
    }) : [[...base, null, null, null, null, null, null, row.manualMax, null, row.assignment.classrooms?.name ?? null]];
  });
}

function reportScope(data: Data) {
  return [data.classroom?.name, data.student?.name].filter(Boolean).join(" · ");
}

export function classroomWorkbook(data: Data, filters: ProgressFilters) {
  const roster = data.student ? [data.student] : data.roster;
  const { progress } = data;
  const overview: Cell[][] = [
    ["Phạm vi", reportScope(data)],
    ["Ngày giao từ", filters.from ?? "Tất cả", "Ngày giao đến", filters.to ?? "Tất cả", "Kỹ năng", filters.skill ?? "Tất cả"],
    ["Đã nộp", progress.completed, "Đã giao", progress.table.length, "Chờ chấm", progress.pending],
    ["Tỷ lệ nộp", progress.table.length ? { type: Number, value: progress.completed / progress.table.length, format: "0%" } : null],
    ["Điểm trung bình tự động", progress.averageAuto === null ? null : { type: Number, value: progress.averageAuto, format: "0.0%" }],
    ["Điểm trung bình thủ công", progress.averageManual === null ? null : { type: Number, value: progress.averageManual, format: "0.0%" }],
    [], ["Kỹ năng hoặc Part", "Đúng", "Đã chấm tự động", "Mục thủ công"],
    ...progress.skills.map(row => [row.label, row.correct, row.total, null]),
    ...progress.parts.map(row => [row.label, row.total ? row.correct : null, row.total || null, row.open || null]),
    ...progress.manualSkills.map(row => [row.label + " · Rubric", { type: Number, value: row.average, format: "0.0%" }, null, row.count]),
    [], ["Câu cần ôn", "Bài giao", "Lượt sai", "Lượt được chấm"],
    ...progress.mistakes.map(row => [row.prompt, row.title, row.wrong, row.total]),
    [], ["Từ vựng đã luyện", "Lượt luyện", "Lượt đúng", "Lượt được chấm"],
    ...progress.vocabulary.map(row => [row.label, row.seen, row.marked ? row.correct : null, row.marked || null]),
  ];
  return writeXlsxFile([
    literalSheet("Danh sách", [["Tên học sinh", "ID hồ sơ", "Trạng thái"], ...roster.map(row =>
      [row.name, row.id, row.archived_at ? "Đã lưu trữ" : "Đang hoạt động"])], [30, 42, 22]),
    literalSheet("Bảng điểm", [["Học sinh", "ID hồ sơ", "Bài giao", "Trạng thái bài", "ID lượt làm", "Bắt đầu (VN)", "Hoàn thành (VN)",
      "Điểm tự động", "Tối đa tự động", "Điểm thủ công", "Tối đa thủ công", "Trạng thái chấm", "Lớp"], ...reportRows(data)],
    [30, 42, 36, 18, 42, 22, 22, 18, 18, 18, 18, 20, 32]),
    literalSheet("Tiến độ", overview, [55, 30, 26, 21, 18, 20]),
  ]);
}

export function classroomPdf(data: Data, filters: ProgressFilters, parent: boolean): PaperDocument {
  const { progress } = data;
  const rate = progress.table.length ? Math.round(100 * progress.completed / progress.table.length) + "%" : "—";
  const roster = parent ? [] : data.student ? [data.student] : data.roster;
  const results = reportRows(data);
  return { title: reportScope(data), heading: parent ? "Tiến độ gửi phụ huynh" : "Báo cáo lớp học", showStudentFields: false, blocks: [
    { text: `Ngày giao: ${filters.from ?? "Tất cả"} – ${filters.to ?? "Tất cả"} (giờ Việt Nam). Kỹ năng: ${filters.skill ?? "Tất cả"}.` },
    { heading: "Kết quả chung", text: `Đã nộp ${progress.completed}/${progress.table.length} · ${rate} · ${progress.pending} lượt chờ chấm` },
    ...(roster.length ? [{ heading: "Danh sách học sinh" }, ...roster.map(row => ({
      text: `${row.name} · ${row.id.slice(0, 8)}${row.archived_at ? " · Đã lưu trữ" : ""}`,
    }))] : []),
    ...(!parent && data.student?.notes ? [{ heading: "Nhận xét riêng của giáo viên", text: data.student.notes }] : []),
    ...(progress.skills.length || progress.manualSkills.length ? [{ heading: "Tiến độ theo kỹ năng" },
      ...progress.skills.map(row => ({ text: `${row.label} · ${row.correct}/${row.total} câu tự động đúng` })),
      ...progress.manualSkills.map(row => ({ text: `${row.label} · Rubric ${Math.round(row.average * 100)}% · ${row.count} bài có điểm` }))] : []),
    ...(progress.parts.length ? [{ heading: "Cambridge theo Part" }, ...progress.parts.map(row => ({
      text: [row.label, row.total ? `${row.correct}/${row.total} câu tự động đúng` : "",
        row.open ? `${row.open} mục giáo viên đánh giá` : ""].filter(Boolean).join(" · "),
    }))] : []),
    ...(results.length ? [{ heading: "Lịch sử bài làm" }, ...results.map(row => ({
      heading: parent ? String(row[2]) : `${row[0]} · ${String(row[1]).slice(0, 8)} · ${row[2]}`,
      text: [row[12], row[3], row[6] ?? row[5], row[7] == null ? null : `Tự động ${row[7]}/${row[8]}`,
        row[9] == null ? null : `Thủ công ${row[9]}/${row[10]}`, row[11] === row[3] ? null : row[11]].filter(Boolean).join(" · "),
    }))] : []),
    ...(progress.mistakes.length ? [{ heading: "Câu cần ôn tập" }, ...progress.mistakes.slice(0, 15).map(row => ({
      text: `${row.prompt} · ${row.title} · ${row.wrong}/${row.total} lượt sai`,
    }))] : []),
    ...(data.student && progress.vocabulary.length ? [{ heading: "Từ vựng đã luyện" }, ...progress.vocabulary.map(row => ({
      text: `${row.label} · ${row.seen} lượt luyện · ${row.marked ? `${row.correct}/${row.marked} lượt đúng có chấm` : "Chưa có điểm tự động"}`,
    }))] : []),
  ] };
}
