import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { worksheet, canPrint, paperOptions, type PaperDocument } from "../lib/worksheet";
import { renderWorksheet } from "../lib/worksheet-pdf";
import { flyerPaper } from "../lib/flyers-paper";
import { moverPaper } from "../lib/movers-paper";
import { starterPaper } from "../lib/starters-paper";
import { demoContent } from "../lib/demo";
import transcripts from "../lib/cambridge-transcripts.json";

test("worksheet and teacher key use separate projections", () => {
  const item = { prompt: "Điền từ", answers: ["hidden-answer"], options: [], explanation: "private-explanation",
    english: { ipa: "/ˈtʃɪldrən/" } };
  expect(JSON.stringify(worksheet("Bài tập", "sentence", [item], "worksheet"))).not.toMatch(/hidden-answer|private-explanation/);
  expect(JSON.stringify(worksheet("Bài tập", "sentence", [item], "key"))).toMatch(/hidden-answer.*private-explanation/);
  expect(canPrint("maze-chase", [item])).toBe(false);
  const crossword = demoContent("crossword");
  expect(worksheet("Ô chữ", "crossword", crossword, "worksheet").blocks[0].grid?.cells.every(cell => !cell.value)).toBe(true);
  expect(worksheet("Ô chữ", "crossword", crossword, "key").blocks[0].grid?.cells.every(cell => !!cell.value)).toBe(true);
  const wordsearch = demoContent("wordsearch");
  expect(worksheet("Tìm từ", "wordsearch", wordsearch, "key").blocks[0].grid?.cells.some(cell => cell.marked)).toBe(true);
});

test("all Cambridge papers have a student handout and original transcripts are teacher-only", () => {
  for (const paper of [starterPaper, moverPaper, flyerPaper]) {
    for (const skill of ["listening", "reading", "speaking"] as const) {
      const { title, template, items } = paper(skill)!;
      const student = worksheet(title, template, items, "worksheet", transcripts);
      expect(student.blocks.length).toBeGreaterThan(items.length);
      const teacher = worksheet(title, template, items, "key", transcripts);
      expect(student.blocks).not.toEqual(teacher.blocks);
      if (skill === "listening") {
        const script = worksheet(title, template, items, "transcript", transcripts);
        expect(script.blocks.every(block => !block.text?.startsWith("Chưa có"))).toBe(true);
        expect(JSON.stringify(student)).not.toContain(script.blocks[0].text);
      }
      if (skill === "speaking") expect(JSON.stringify(student)).not.toContain(items[0].practice?.starters?.teacher);
    }
  }
});

test("PDFKit renders a multi-page handout with an embedded Unicode font", async () => {
  const labels = Array.from({ length: 32 }, (_, i) => ({
    prompt: `Câu hỏi số ${i + 1} · Điền vào chỗ trống`, answers: ["secret-key"], options: [], english: { ipa: "/ˈtʃɪldrən/ /θɜːd/" },
  }));
  const versions: { name: string; doc: PaperDocument; version: "worksheet" | "key" }[] = [
    { name: "worksheet-sample", doc: worksheet("Tiếng Việt và phiên âm quốc tế", "sentence", labels, "worksheet"), version: "worksheet" },
    { name: "answer-key-sample", doc: worksheet("Tiếng Việt và phiên âm quốc tế", "sentence", labels, "key"), version: "key" },
  ];
  const folder = process.env.WORKSHEET_PDF_EVIDENCE;
  if (folder) mkdirSync(folder, { recursive: true });
  for (const { name, doc, version } of versions) {
    const pdf = await renderWorksheet(doc, paperOptions.parse({ version, colour: false, fontSize: "16" }));
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    const objects = pdf.toString("latin1");
    expect(objects.match(/\/Type \/Page\b/g)?.length).toBeGreaterThan(1);
    expect(objects).toContain("/FontFile2");
    if (folder) writeFileSync(join(folder, name + ".pdf"), pdf);
  }
});
