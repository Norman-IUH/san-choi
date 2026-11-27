"use client";
import { useEffect, useRef, useState } from "react";
import { cellKey } from "@/lib/games/word-puzzles";
import { LessonMedia, Pronunciation } from "./LessonMedia";
import type { RoundProps } from "./LegacyRound";

export default function BoardRound({ template, items, answers, setAnswers, assets, busy, bindFocus, submit }: RoundProps) {
  const [clue, setClue] = useState(0);
  const [left, setLeft] = useState<number>();
  const [right, setRight] = useState<string>();
  const [announcement, setAnnouncement] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const media = (index: number) => <><LessonMedia media={items[index].media} assets={assets} label={items[index].prompt}/>
    <Pronunciation item={items[index]} assets={assets}/></>;

  if (template === "matching-pairs") {
    const paired = Object.values(answers).flat();
    return <div className="play-stack memory-game">
      <h2 tabIndex={-1} ref={node => { heading.current = node; bindFocus(node); }}>Lật và ghép thẻ</h2>
      <div className="memory-table">
        <div role="group" aria-label="Thẻ gợi ý">{items.map((item, i) => {
          const matched = answers[i]?.[0];
          const shown = i === left || Boolean(matched);
          return <div key={i}><button className="option memory-card" aria-pressed={i === left} aria-expanded={shown} type="button" disabled={Boolean(matched)}
            onClick={() => setLeft(i === left ? undefined : i)}>{shown ? item.prompt : "Gợi ý " + (i + 1)}</button>
            {shown && media(i)}
            {matched && <button className="button" type="button" onClick={() => {
              setAnswers(previous => { const remaining = { ...previous }; delete remaining[i]; return remaining; });
              setAnnouncement("Đã bỏ cặp " + item.prompt);
            }}>Bỏ cặp {i + 1}</button>}
          </div>;
        })}</div>
        <div role="group" aria-label="Thẻ đáp án">{items[0].options.map((answer, i) => {
          const shown = right === answer || paired.includes(answer);
          return <button className="option memory-card" key={answer} aria-pressed={right === answer} aria-expanded={shown} type="button"
            disabled={paired.includes(answer)} onClick={() => setRight(right === answer ? undefined : answer)}>
            {shown ? answer : "Đáp án " + (i + 1)}</button>;
        })}</div>
      </div>
      <p role="status">{announcement}</p>
      <div className="inline-actions"><button className="button" type="button" disabled={left === undefined || right === undefined}
        onClick={() => {
          if (left === undefined || right === undefined) return;
          setAnswers(previous => ({ ...previous, [left]: [right] }));
          setAnnouncement(items[left].prompt + " ghép với " + right);
          setLeft(undefined); setRight(undefined);
        }}>Ghép hai thẻ</button>
        <button className="button primary" disabled={busy || paired.length !== items.length}
          onClick={() => submit(answers)}>{busy ? "Đang nộp…" : "Hoàn thành"}</button></div>
    </div>;
  }

  const slots = items.map(item => item.slot!);
  const cells = slots.flatMap(slot => slot.cells);
  const columns = Math.max(...cells.map(cell => cell.column)) + 1;
  const rows = Math.max(...cells.map(cell => cell.row)) + 1;
  const letters = new Map<string, string>();
  const numbered = new Map<string, number[]>();
  slots.forEach((slot, index) => {
    const key = cellKey(slot.cells[0]);
    numbered.set(key, [...(numbered.get(key) ?? []), index + 1]);
    slot.cells.forEach((cell, offset) => {
      const current = answers[index]?.[offset];
      if (current) letters.set(cellKey(cell), current);
    });
  });
  const complete = cells.every(cell => Boolean(letters.get(cellKey(cell))));
  const selected = slots[clue];
  const activeCells = new Set(selected.cells.map(cellKey));

  return <div className="play-stack crossword-game">
    <h2 tabIndex={-1} ref={node => { heading.current = node; bindFocus(node); }}>Ô chữ tiếng Anh</h2>
    <div className="crossword-board" style={{ gridTemplateColumns: "repeat(" + columns + ", minmax(0, 1fr))" }} aria-hidden="true">
      {Array.from({ length: columns * rows }, (_, index) => {
        const key = cellKey({ row: Math.floor(index / columns), column: index % columns });
        const used = cells.some(cell => cellKey(cell) === key);
        return <span key={key} className={used ? "crossword-cell" + (activeCells.has(key) ? " active" : "") : ""}>
          {numbered.has(key) && <small>{numbered.get(key)?.join("/")}</small>}{letters.get(key)}
        </span>;
      })}
    </div>
    <div className="crossword-clues" role="group" aria-label="Gợi ý ô chữ">{items.map((item, index) =>
      <button className="option" type="button" key={index} aria-pressed={index === clue} onClick={() => setClue(index)}>
        {index + 1} {slots[index].across ? "Ngang" : "Dọc"} · {item.prompt}
      </button>)}</div>
    {media(clue)}
    <label>Đáp án ô chữ {clue + 1}<input lang="en" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={selected.cells.length}
      value={selected.cells.map(cell => letters.get(cellKey(cell)) || " ").join("").trimEnd()} onChange={event => {
        const value = event.target.value.toUpperCase().replace(/[^A-Z ]/g, "");
        selected.cells.forEach((cell, index) => letters.set(cellKey(cell), value[index]?.trim() || ""));
        setAnswers(Object.fromEntries(slots.map((slot, index) => [index, slot.cells.map(cell => letters.get(cellKey(cell)) || "")])));
      }}/></label>
    <button className="button primary" disabled={busy || !complete} onClick={() =>
      submit(Object.fromEntries(slots.map((slot, index) => [index, [slot.cells.map(cell => letters.get(cellKey(cell))).join("")]])))}>
      {busy ? "Đang nộp…" : "Hoàn thành"}
    </button>
  </div>;
}
