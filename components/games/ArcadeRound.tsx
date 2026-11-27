"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play } from "lucide-react";
import { ArcadeSimulation, type Direction } from "@/lib/games/arcade-runtime";
import { arcadeWorlds, hasArcadeCanvas, isArcadeTemplate, riskMarker } from "@/lib/games/arcade-templates";
import type { RoundProps } from "./LegacyRound";
import { LessonMedia, Pronunciation } from "./LessonMedia";
import { RiskBoard, SortingBoard } from "./ArcadeBoards";

const ArcadeCanvas = dynamic(() => import("./ArcadeCanvas"), { ssr: false, loading: () => <p role="status">Đang mở sân chơi…</p> });
const directions = [
  { action: "up", label: "Lên", Icon: ArrowUp }, { action: "left", label: "Trái", Icon: ArrowLeft },
  { action: "down", label: "Xuống", Icon: ArrowDown }, { action: "right", label: "Phải", Icon: ArrowRight },
] as const;
const keyboard: Record<string, Direction | undefined> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };

export default function ArcadeRound({ template, items, index, turn, answers, next, busy, assets, bindFocus, playHit, hudTools }: RoundProps) {
  if (!isArcadeTemplate(template)) throw new Error("Unknown arcade stage");
  const item = items[index];
  const [world] = useState(() => new ArcadeSimulation(template, item, matchMedia("(prefers-reduced-motion: reduce)").matches));
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<number | null | undefined>(undefined);
  const [seconds, setSeconds] = useState(world.duration);
  const [risk, setRisk] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const mapped = template === "maze-chase";
  const plane = template === "airplane";
  const canvas = hasArcadeCanvas(template);
  const blocked = paused || selected !== undefined;
  const riskAvailable = !Object.values(answers).some(answer => answer.includes(riskMarker));
  const pauseControl = <button className="icon-button" type="button" aria-pressed={paused} aria-label={paused ? "Tiếp tục chơi" : "Tạm dừng"}
    onClick={() => { world.setPaused(!paused); setPaused(!paused); }}>
    {paused ? <Play size={19} aria-hidden="true"/> : <Pause size={19} aria-hidden="true"/>}
  </button>;

  useEffect(() => {
    stage.current?.focus();
    const pause = () => { world.setPaused(true); setPaused(true); };
    const hidden = () => { if (document.hidden) pause(); };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [world]);

  useEffect(() => {
    if (canvas || !world.duration || blocked) return;
    const timer = window.setInterval(() => {
      world.tick(50);
      setSeconds(Math.max(0, Math.ceil(world.duration - world.elapsed)));
      if (world.expired) setSelected(null);
    }, 50);
    return () => window.clearInterval(timer);
  }, [blocked, canvas, world]);

  function outcome(choice: number | null) {
    setSelected(choice);
    if (choice !== null) playHit?.();
  }

  function pickBoard(index: number) {
    if (blocked) return;
    world.pick(index);
    if (world.choice !== null) outcome(world.choice);
  }

  function control(event: KeyboardEvent) {
    const direction = keyboard[event.key];
    if (!direction || (!mapped && !plane)) return;
    event.preventDefault();
    world.move(direction);
  }

  return <div className="play-stack arcade-round" data-paused={paused} onKeyDown={control}>
    <div className="arcade-hud">
      <span className="arcade-counter">Đã ghi {Object.keys(answers).length}/{items.length}</span>
      {world.duration > 0 && <span className="arcade-counter" role="timer">{seconds} giây</span>}
      {hudTools ? createPortal(pauseControl, hudTools) : pauseControl}
    </div>
    <h2 tabIndex={-1} ref={bindFocus} className="arcade-question">{item.prompt}</h2>
    <div className={`arcade-field${canvas ? "" : " arcade-dom-field"}`} ref={stage} tabIndex={0} aria-label="Sân chơi arcade"
      style={{ backgroundImage: "url(/illustrations/arcade/" + template + ".webp)", borderColor: arcadeWorlds[template].colors[1] }}>
      {canvas ? <ArcadeCanvas simulation={world} assets={assets} onOutcome={outcome} onClock={setSeconds}/> :
        template === "speed-sorting" ? <SortingBoard item={item} blocked={blocked} selected={selected} onPick={pickBoard}/> :
          <RiskBoard item={item} assets={assets} risk={risk} setRisk={setRisk} riskAvailable={riskAvailable} blocked={blocked} selected={selected} onPick={pickBoard}/>}
      {paused && <div className="arcade-overlay">Đang tạm dừng</div>}
    </div>
    {(mapped || plane) && <div className={mapped ? "arcade-direction arcade-dpad" : "arcade-direction"} role="group" aria-label="Điều khiển di chuyển">
      {directions.filter(({ action }) => mapped || action === "up" || action === "down").map(({ action, label, Icon }) =>
        <button key={action} data-direction={action} className="button" type="button" aria-label={label} disabled={paused || selected !== undefined}
          onClick={() => world.move(action)}><Icon size={20}/>{label}</button>)}
    </div>}
    <div className="arcade-support">
      <LessonMedia media={item.media} assets={assets} label={item.prompt}/><Pronunciation item={item} assets={assets}/>
      <details><summary>{mapped || plane || !canvas ? "Đọc mục tiêu" : "Chọn mục tiêu bằng bàn phím"}</summary>
        <div className="options">{item.options.map((option, position) => {
          const media = item.optionMedia?.find(entry => entry.option === option);
          return <div key={option}>
            {mapped || plane || !canvas ? <span>{option}</span> : <button className="option" disabled={paused || selected !== undefined}
              onClick={() => world.pick(position)}>{option}</button>}
            <LessonMedia media={media} assets={assets} label={option}/>
          </div>;
        })}</div></details>
    </div>
    {selected !== undefined && <div className="arcade-confirm">
      <p aria-live="polite">{selected === null ? "Đã hết thời gian." : "Đã chọn " + item.options[selected]}</p>
      <button className="button primary" disabled={busy} onClick={() => next(selected === null ? [] :
        risk && riskAvailable ? [item.options[selected], riskMarker] : [item.options[selected]])}>
        {busy ? "Đang nộp…" : turn + 1 === items.length ? "Hoàn thành" : "Tiếp theo"}</button>
    </div>}
  </div>;
}
