import type { NextRequest } from "next/server";
import { classroomData } from "@/lib/classroom-server";
import { classroomPdf, classroomWorkbook } from "@/lib/classroom-report";
import { readProgressFilters } from "@/lib/classroom-progress";
import { paperOptions } from "@/lib/worksheet";
import { renderWorksheet } from "@/lib/worksheet-pdf";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters = readProgressFilters(Object.fromEntries(params));
  const format = params.get("format");
  const parent = params.get("audience") === "parent";
  if (!filters.success || (format !== "pdf" && format !== "xlsx") || (parent && (format !== "pdf" || !filters.data.student))) {
    return new Response("Kiểm tra phạm vi và định dạng báo cáo.", { status: 400 });
  }
  const data = await classroomData(filters.data);
  // shortcut: bounded in-process exports, use a queued export if larger reports are needed.
  const count = data.progress.table.reduce((sum, row) => sum + Math.max(1, row.tries.length), 0);
  if (count > (format === "pdf" ? 1000 : 10000)) {
    return new Response("Báo cáo quá lớn. Hãy thu hẹp ngày giao hoặc chọn một học sinh.", { status: 413 });
  }
  const bytes = format === "pdf" ? await renderWorksheet(classroomPdf(data, filters.data, parent), paperOptions.parse({}))
    : await classroomWorkbook(data, filters.data).toBuffer();
  return new Response(new Uint8Array(bytes), { headers: {
    "Content-Type": format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `${format === "pdf" ? "inline" : "attachment"}; filename="bao-cao-lop-hoc.${format}"`,
    "Cache-Control": "private, no-store", "Cross-Origin-Resource-Policy": "same-origin",
  } });
}
