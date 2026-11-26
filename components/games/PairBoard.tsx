"use client";
import { useId, useRef, useState, type ReactNode } from "react";
import { type PlayItem } from "@/lib/game";

export function PairBoard({ items, answers, grouping, onAssign, renderMedia }: {
  items: PlayItem[];
  answers: Record<number, string[]>;
  grouping: boolean;
  onAssign: (row: number, value: string) => void;
  renderMedia: (item: PlayItem) => ReactNode;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const touchDrop = useRef(false);
  const selectionId = useId();
  const instructions = grouping ? "Kéo thẻ vào nhóm, hoặc chọn thẻ rồi chọn nhóm." : "Kéo thẻ sang đáp án, hoặc chọn thẻ rồi chọn đáp án.";
  const options = items[0]?.options ?? [];

  function assign(row: number, answer: string) {
    if (!Number.isInteger(row) || !items[row]?.options.includes(answer)) return;
    onAssign(row, answer);
    setSelected(null);
    setAnnouncement(items[row].prompt + " → " + answer);
  }

  return <div className="play-stack">
    <p>{instructions}</p>
    <p role="status" className="sr-only">{announcement}</p>
    <div className="pair-board">
      <div role="group" aria-label="Thẻ cần ghép">
        {items.map((item, row) => <div className="pair-row" key={row}>
          <button type="button" className="option pair-choice" draggable
            aria-label={item.prompt} aria-describedby={answers[row]?.[0] ? `${selectionId}-${row}` : undefined} aria-pressed={selected === row}
            onClick={() => {
              if (touchDrop.current) { touchDrop.current = false; return; }
              setSelected(selected === row ? null : row);
            }}
            onDragStart={event => { event.dataTransfer.setData("application/x-sanchoi-row", String(row)); event.dataTransfer.effectAllowed = "move"; }}
            onPointerDown={event => {
              touchDrop.current = false;
              if (event.pointerType === "touch") event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerUp={event => {
              if (event.pointerType !== "touch") return;
              const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-pair-option]");
              const answer = target?.dataset.pairOption;
              if (answer !== undefined) { touchDrop.current = true; assign(row, answer); }
            }}>
            <span>{item.prompt}</span>
            {answers[row]?.[0] && <small id={`${selectionId}-${row}`}>{answers[row][0]}</small>}
          </button>
          {renderMedia(item)}
        </div>)}
      </div>
      <div role="group" aria-label={grouping ? "Nhóm" : "Đáp án ghép"}>
        {options.map(option => <button type="button" key={option} className="option pair-target"
          aria-label={option} data-pair-option={option} aria-disabled={selected === null}
          onClick={() => { if (selected !== null) assign(selected, option); }}
          onDragOver={event => { if (event.dataTransfer.types.includes("application/x-sanchoi-row")) event.preventDefault(); }}
          onDrop={event => {
            event.preventDefault();
            const raw = event.dataTransfer.getData("application/x-sanchoi-row");
            if (raw) assign(Number(raw), option);
          }}>
          <span>{option}</span>
          {grouping && <small>{items.reduce((count, _, row) => count + Number(answers[row]?.[0] === option), 0)} thẻ</small>}
        </button>)}
      </div>
    </div>
  </div>;
}
