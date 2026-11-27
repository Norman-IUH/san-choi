import PDFDocument from "pdfkit";
import { join } from "node:path";
import type { PaperBlock, PaperDocument, PaperOptions } from "./worksheet";

export type PrintImage = { bytes: Buffer; width: number; height: number };

export async function renderWorksheet(document: PaperDocument, options: PaperOptions, images = new Map<string, PrintImage>()) {
  const font = join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf");
  const doc = new PDFDocument({ autoFirstPage: false, size: options.paper, margin: 0, font,
    info: { Title: options.title || document.title, Author: "Sân Chơi" } });
  const output = new Promise<Buffer>((resolve, reject) => {
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
  });
  const accent = options.colour ? "#24555a" : "#242424";
  const border = options.colour ? "#aec4bf" : "#aaaaaa";
  const fontSize = Number(options.fontSize);
  const margin = 40;
  let page = 0, y = margin;
  const width = () => doc.page.width - 2 * margin;
  const bottom = () => doc.page.height - 51;

  function height(text: string, size: number, area: number) {
    return text ? doc.fontSize(size).heightOfString(text, { width: area, lineGap: 2 }) : 0;
  }
  function text(value: string, x: number, top: number, area: number, size: number, ink = "#222222") {
    doc.fillColor(ink).fontSize(size).text(value, x, top, { width: area, lineGap: 2 });
    return top + height(value, size, area);
  }
  function newPage(first: boolean) {
    doc.addPage();
    page++;
    y = margin;
    doc.moveTo(margin, bottom() + 9).lineTo(doc.page.width - margin, bottom() + 9).strokeColor(border).stroke();
    text(`Sân Chơi · ${document.heading} · ${page}`, margin, bottom() + 15, width(), 9, accent);
    y = text(first ? document.heading : (options.title || document.title), margin, y, width(), first ? 11 : 10, accent) + 7;
    if (!first) return;
    y = text(options.title || document.title, margin, y, width(), 22, accent) + 10;
    if (options.version === "worksheet" && document.heading !== "Giáo án") {
      const fields = `Họ tên ${options.student || "____________________"}     Lớp ${options.className || "________"}     Ngày ${options.date || "________"}`;
      y = text(fields, margin, y, width(), fontSize) + 8;
    }
    if (options.instructions) y = text(options.instructions, margin, y, width(), fontSize) + 8;
    y += 5;
  }

  function measure(block: PaperBlock, area: number) {
    const figures = block.figures ?? [];
    const cols = figures.length === 1 ? 1 : Math.min(4, figures.length);
    const photo = cols === 1 ? (block.card ? 80 : 143) : 74;
    const colWidth = cols === 0 ? area : (area - (cols - 1) * 8) / cols;
    const rows = [];
    for (let i = 0; i < figures.length; i += cols) {
      const visible = figures.slice(i, i + cols);
      rows.push({ figures: visible, captionHeight: Math.max(0, ...visible.map(figure => height(figure.label ?? "", 9, colWidth))) });
    }
    const cell = block.grid ? Math.min(19, area / block.grid.width) : 0;
    const total = height(block.heading ?? "", fontSize + 1, area) + (block.heading ? 5 : 0) +
      height(block.text ?? "", fontSize, area) + (block.text ? 5 : 0) +
      rows.reduce((sum, row) => sum + photo + row.captionHeight + 8, 0) +
      (block.grid ? cell * block.grid.height + 8 : 0) + (block.lines ?? 0) * (fontSize + 9) + 7;
    return { total, rows, colWidth, photo, cell };
  }

  function draw(block: PaperBlock, x: number, top: number, area: number, layout = measure(block, area)) {
    let rowY = top;
    if (block.heading) rowY = text(block.heading, x, rowY, area, fontSize + 1, accent) + 5;
    if (block.text) rowY = text(block.text, x, rowY, area, fontSize) + 5;
    for (const row of layout.rows) {
      row.figures.forEach((figure, i) => {
        const image = images.get(figure.path);
        const imageX = x + i * (layout.colWidth + 8);
        if (image) {
          const scale = Math.min(layout.colWidth / image.width, layout.photo / image.height);
          const actualWidth = image.width * scale, actualHeight = image.height * scale;
          const cx = imageX + (layout.colWidth - actualWidth) / 2;
          doc.image(image.bytes, cx, rowY, { width: actualWidth, height: actualHeight });
          figure.pins?.forEach(pin => {
            const px = cx + actualWidth * pin.x / 100, py = rowY + actualHeight * pin.y / 100;
            doc.circle(px, py, 6).fillAndStroke("#ffffff", "#222222");
            doc.fontSize(8).fillColor("#222222").text(pin.id, px - 5, py - 5, { width: 10, align: "center", lineBreak: false });
          });
        } else {
          doc.rect(imageX, rowY, layout.colWidth, layout.photo).strokeColor(border).stroke();
          text("Hình ảnh chưa tải được", imageX + 5, rowY + 8, layout.colWidth - 10, 9);
        }
        if (figure.label) text(figure.label, imageX, rowY + layout.photo, layout.colWidth, 9);
      });
      rowY += layout.photo + row.captionHeight + 8;
    }
    if (block.grid) {
      const step = layout.cell;
      for (const cell of block.grid.cells) {
        const cx = x + cell.column * step;
        const cy = rowY + cell.row * step;
        const square = doc.rect(cx, cy, step, step);
        if (cell.marked) square.fillAndStroke(options.colour ? "#dbece7" : "#dddddd", border);
        else square.strokeColor(border).stroke();
        if (cell.number) doc.fontSize(6).fillColor(accent).text(cell.number, cx + 1, cy + 1, { lineBreak: false });
        if (cell.value) doc.fontSize(10).fillColor("#222222").text(cell.value, cx, cy + 4, { width: step, align: "center", lineBreak: false });
      }
      rowY += step * block.grid.height + 8;
    }
    for (let i = 0; i < (block.lines ?? 0); i++) {
      rowY += fontSize + 9;
      doc.moveTo(x, rowY - 3).lineTo(x + area, rowY - 3).strokeColor(border).stroke();
    }
  }

  newPage(true);
  if (document.cards) {
    const area = (width() - 12) / 2;
    for (let i = 0; i < document.blocks.length; i += 2) {
      const row = document.blocks.slice(i, i + 2);
      const rowHeight = Math.max(104, ...row.map(block => measure(block, area - 20).total + 16));
      if (y + rowHeight > bottom()) newPage(false);
      row.forEach((block, index) => {
        const x = margin + index * (area + 12);
        doc.roundedRect(x, y, area, rowHeight, 5).strokeColor(border).stroke();
        draw(block, x + 10, y + 8, area - 20);
      });
      y += rowHeight + 11;
    }
  } else {
    for (const block of document.blocks) {
      const size = measure(block, width()).total;
      if (size > 610 && block.text) {
        const parts = block.text.match(/[^\n]{1,360}(?:\n|$)|[^\n]{1,360}/gu) ?? [];
        const [first, ...rest] = parts;
        const pieces = [{ ...block, text: first }, ...rest.map(text => ({ text }))];
        for (const piece of pieces) {
          const height = measure(piece, width()).total;
          if (y + height > bottom()) newPage(false);
          draw(piece, margin, y, width());
          y += height;
        }
      } else {
        if (y + size > bottom()) newPage(false);
        draw(block, margin, y, width());
        y += size;
      }
    }
  }
  doc.end();
  return output;
}
