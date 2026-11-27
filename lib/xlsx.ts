import type { Cell } from "write-excel-file/node";

export function literalSheet(sheet: string, data: Cell[][], widths: number[]) {
  return { sheet, columns: widths.map(width => ({ width })),
    data: data.map((row, index) => row.map((cell): Cell => typeof cell === "string"
      ? { type: String, value: cell, fontWeight: index === 0 ? "bold" : undefined } : cell)) };
}
