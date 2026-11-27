"use client";
import { useRef, useState } from "react";
import { LessonMedia } from "./LessonMedia";
import type { PlayItem } from "@/lib/games/model";

export function SortingBoard({ item, blocked, selected, onPick }: {
  item: PlayItem; blocked: boolean; selected?: number | null; onPick: (value: number) => void;
}) {
  const [carrying, setCarrying] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);
  return <div className="arcade-sort">
    <button className="arcade-sort-token" type="button" disabled={blocked}
      aria-label={"Cầm thẻ " + item.prompt} aria-pressed={carrying} onClick={() => setCarrying(!carrying)}
      onPointerDown={event => {
        if (event.button !== 0) return;
        drag.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        if (!drag.current) return;
        event.currentTarget.style.transform = `translate(${event.clientX - drag.current.x}px, ${event.clientY - drag.current.y}px)`;
      }}
      onLostPointerCapture={event => { drag.current = null; event.currentTarget.style.transform = ""; }}
      onPointerUp={event => {
        if (!drag.current) return;
        drag.current = null;
        event.currentTarget.style.transform = "";
        const bins = event.currentTarget.parentElement?.querySelectorAll<HTMLElement>("[data-arcade-bin]");
        const bin = Array.from(bins ?? []).find(bin => {
          const rect = bin.getBoundingClientRect();
          return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
        });
        if (bin?.dataset.arcadeBin !== undefined) { setCarrying(false); onPick(Number(bin.dataset.arcadeBin)); }
      }}>
      {item.prompt}
    </button>
    <div role="group" aria-label="Các thùng phân loại" className="arcade-bins">
      {item.options.map((option, index) => <button key={option} type="button" className="arcade-bin" data-arcade-bin={index}
        aria-label={option} aria-pressed={selected === index} aria-disabled={blocked || !carrying}
        onClick={() => { if (carrying && !blocked) { setCarrying(false); onPick(index); } }}>
        <span className="arcade-bin-art" aria-hidden="true"/><span>{option}</span>
      </button>)}
    </div>
  </div>;
}

export function RiskBoard({ item, assets, risk, riskAvailable, blocked, selected, setRisk, onPick }: {
  item: PlayItem; assets: Record<string, string>; risk: boolean; riskAvailable: boolean; blocked: boolean; selected?: number | null;
  setRisk: (value: boolean) => void; onPick: (value: number) => void;
}) {
  return <div className="arcade-risk">
    <div className="arcade-risk-rules">
      <button className="button" type="button" disabled={blocked || !riskAvailable} aria-pressed={risk} onClick={() => setRisk(!risk)}>
        {riskAvailable ? "Thử sức" : "Đã dùng lượt thử sức"}
      </button>
      <p>{risk ? "Đúng +2 · Sai −1" : "Đúng +1 · Sai 0"}</p>
    </div>
    <div className="arcade-risk-answers" role="group" aria-label="Chọn đáp án sân khấu">
      {item.options.map((option, index) => {
        const attachment = item.optionMedia?.find(entry => entry.option === option);
        return <button key={option} type="button" className="option" disabled={blocked} aria-pressed={selected === index}
          onClick={() => onPick(index)}>
          <LessonMedia media={{ image: attachment?.image }} assets={assets} label=""/>
          {option}
        </button>;
      })}
    </div>
  </div>;
}
