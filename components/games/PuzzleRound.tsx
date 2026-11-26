"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { normalize } from "@/lib/games/model";
import { LessonMedia, Pronunciation } from "./LessonMedia";
import { Progress } from "./Progress";
import type { RoundProps } from "./LegacyRound";

export default function PuzzleRound({ template, items, index, turn, answers, setAnswers, assets, busy, bindFocus, next, submit }: RoundProps) {
  const item = items[index];
  const [value, setValue] = useState("");
  const [order, setOrder] = useState(() => item.options.map((_, position) => position));
  const [picked, setPicked] = useState<number[]>([]);
  const [hidden, setHidden] = useState(false);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const memoryBank = useRef<HTMLDivElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => { if (hidden) memoryBank.current?.querySelector("button")?.focus(); }, [hidden]);

  const finishText = busy ? "Đang nộp…" : turn + 1 === items.length ? "Hoàn thành" : "Tiếp theo";
  const media = <><LessonMedia media={item.media} assets={assets} label={item.prompt}/><Pronunciation item={item} assets={assets}/></>;
  const focus = (node: HTMLElement | null) => { heading.current = node as HTMLHeadingElement | null; bindFocus(node); };
  const finish = (response: string[], enabled: boolean) =>
    <button className="button primary" disabled={busy || !enabled} onClick={() => next(response)}>{finishText}</button>;

  function move(current: number, destination: number) {
    if (current === destination || !order.includes(current) || destination < 0 || destination >= order.length) return;
    const updated = order.filter(tile => tile !== current);
    updated.splice(destination, 0, current);
    setOrder(updated);
    setAnnouncement(item.options[current] + " ở vị trí " + (destination + 1));
  }

  if (template === "flip-tiles") return <div className="play-stack flip-tiles-board">
    <h2 ref={focus} tabIndex={-1}>Lật ô để kiểm tra</h2>
    <Progress value={Object.keys(answers).length} total={items.length}/>
    <div className="flip-grid">{items.map((tile, i) => {
      const revealed = flipped.includes(i);
      return <div className="flip-tile" key={i}>
        <button type="button" className="option" aria-expanded={revealed} onClick={() => {
          setFlipped(revealed ? flipped.filter(position => position !== i) : [...flipped, i]);
          setAnswers(previous => ({ ...previous, [i]: [] }));
        }}>
          <span className="flash-face" lang={revealed ? undefined : "en"} key={String(revealed)}>{revealed ? tile.reveal : tile.prompt}</span>
          <small>{revealed ? "Về mặt trước" : "Lật ô"}</small>
        </button>
        {revealed && <><LessonMedia media={tile.media} assets={assets} label={tile.prompt}/><Pronunciation item={tile} assets={assets}/></>}
      </div>;
    })}</div>
    <button className="button primary" disabled={busy || Object.keys(answers).length !== items.length}
      onClick={() => submit(answers)}>{busy ? "Đang nộp…" : "Hoàn thành"}</button>
  </div>;

  let game: ReactNode;
  let questionMedia = media;
  switch (template) {
    case "labelled-diagram":
      questionMedia = <><div className="diagram-picture">
        <LessonMedia media={{ image: item.media?.image }} assets={assets} label="Sơ đồ của câu hỏi"/>
        {item.pin && <button type="button" className="diagram-pin"
          style={{ left: item.pin.x + "%", top: item.pin.y + "%" }}
          aria-label={value ? "Vị trí gắn nhãn: " + value : "Vị trí gắn nhãn"} onClick={() => setValue("")}
          onDragOver={event => event.preventDefault()} onDrop={event => {
            event.preventDefault();
            const dragged = event.dataTransfer.getData("application/x-sanchoi-label");
            if (item.options.includes(dragged)) setValue(dragged);
          }}><span aria-hidden="true">{value || "?"}</span></button>}
      </div><LessonMedia media={{ audio: item.media?.audio }} assets={assets} label="Nghe gợi ý"/><Pronunciation item={item} assets={assets}/></>;
      game = <><div className="diagram-options" role="group" aria-label="Nhãn sơ đồ">{item.options.map(option =>
        <button className="option" key={option} aria-pressed={value === option} draggable
          onDragStart={event => event.dataTransfer.setData("application/x-sanchoi-label", option)}
          onClick={() => setValue(option)}>{option}</button>)}</div>{finish([value], Boolean(value))}</>;
      break;
    case "rank-order":
      game = <><ol className="ranking-board" aria-label="Thứ tự của em">{order.map((tile, position) =>
        <li key={tile} draggable onDragStart={event => event.dataTransfer.setData("application/x-sanchoi-rank", String(tile))}
          onDragOver={event => event.preventDefault()} onDrop={event => {
            event.preventDefault();
            const source = event.dataTransfer.getData("application/x-sanchoi-rank");
            if (source) move(Number(source), position);
          }}>
          <div className="rank-row"><span>{item.options[tile]}</span><div className="inline-actions">
            <button className="icon-button" type="button" aria-label={"Đưa lên " + item.options[tile]} disabled={position === 0} onClick={() => move(tile, position - 1)}>↑</button>
            <button className="icon-button" type="button" aria-label={"Đưa xuống " + item.options[tile]} disabled={position + 1 === order.length} onClick={() => move(tile, position + 1)}>↓</button>
          </div></div>
        </li>)}</ol><p className="sr-only" role="status">{announcement}</p>
        {finish(order.map(tile => item.options[tile]), order.length > 0)}</>;
      break;
    case "pair-or-no-pair":
      questionMedia = <><div className="comparison-board" lang="en">
        <div><strong>{item.prompt}</strong><LessonMedia media={item.media} assets={assets} label="Hình thẻ thứ nhất"/></div>
        <span aria-hidden="true">↔</span><div><strong>{item.secondary}</strong></div>
      </div><Pronunciation item={item} assets={assets}/></>;
      game = <><div className="diagram-options" role="group" aria-label="Hai thẻ có hợp thành một cặp không">
        {["Pair", "No Pair"].map(option => <button className="option" key={option} aria-pressed={value === option}
          onClick={() => setValue(option)}>{option}</button>)}</div>{finish([value], Boolean(value))}</>;
      break;
    case "image-quiz":
      game = <><div className="picture-answers" role="group" aria-label="Chọn ảnh">
        {item.options.map((option, position) => {
          const media = item.optionMedia?.find(entry => normalize(entry.option) === normalize(option));
          return <div key={option} className="option-with-media"><button className="option" aria-label={option}
            aria-pressed={value === option} onClick={() => setValue(option)}>
            <LessonMedia media={{ image: media?.image }} assets={assets} label=""/><span aria-hidden="true">{"ABCDEFGH"[position]}</span>
          </button><LessonMedia media={{ audio: media?.audio }} assets={assets} label={"Nghe " + option}/></div>;
        })}
      </div>{finish([value], Boolean(value))}</>;
      break;
    case "watch-memorize":
      game = !hidden ? <><ol className="memory-strip" aria-label="Chuỗi cần nhớ" lang="en">
        {item.memory?.map((word, position) => <li key={position}>{word}</li>)}</ol>
        <button className="button primary" onClick={() => setHidden(true)}>Che thẻ và xếp lại</button></>
        : <><div className="memory-strip" role="group" aria-label="Chuỗi của em">
          {picked.map(tile => <button className="option" type="button" key={tile} aria-label={"Bỏ " + item.options[tile]}
            onClick={() => setPicked(picked.filter(position => position !== tile))}>{item.options[tile]}</button>)}
        </div><div className="diagram-options" role="group" aria-label="Các thẻ để xếp" ref={memoryBank}>
          {item.options.map((word, tile) => <button className="option" key={tile} type="button" disabled={picked.includes(tile)}
            onClick={() => setPicked([...picked, tile])}>{word}</button>)}
        </div>{finish(picked.map(tile => item.options[tile]), picked.length === item.options.length)}</>;
      break;
    case "maths-generator":
      game = <form className="math-pad" onSubmit={event => {
        event.preventDefault();
        if (!busy && /^\d+$/.test(value.trim())) next([value]);
      }}>
        {item.equation && <p className="math-equation">{item.equation.left} {item.equation.symbol} {item.equation.right} <span>= ?</span></p>}
        <label>Kết quả phép tính<input value={value} onChange={event => setValue(event.target.value)} inputMode="numeric" maxLength={5}/></label>
        <button className="button primary" disabled={busy || !/^\d+$/.test(value.trim())}>{finishText}</button>
      </form>;
      break;
  }
  return <div className="play-stack puzzle-round">
    <Progress value={turn + 1} total={items.length}/>
    <h2 className="lesson-text" tabIndex={-1} ref={focus}>{template === "pair-or-no-pair" ? "So sánh hai thẻ" : item.prompt}</h2>
    {questionMedia}{game}
  </div>;
}
