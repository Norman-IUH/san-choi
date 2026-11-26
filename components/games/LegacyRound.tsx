"use client";
import { useId, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { doubleMarker, templates, type PlayItem, type Template } from "@/lib/game";
import { LessonMedia, Pronunciation } from "./LessonMedia";
import { PairBoard } from "./PairBoard";
import { Wheel } from "./Wheel";
import { Progress } from "./Progress";

export type RoundProps = {
  template: Template;
  items: PlayItem[];
  order: number[];
  turn: number;
  index: number;
  answers: Record<number, string[]>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string[]>>>;
  assets: Record<string, string>;
  reveals: string[];
  busy: boolean;
  bindFocus: (node: HTMLElement | null) => void;
  next: (answer: string[]) => void;
  submit: (answers: Record<number, string[]>) => void;
  guess?: (letters: string[]) => Promise<{ pattern: string[]; misses: number } | null>;
};

export function LegacyRound({ template, items, order, turn, index, answers, setAnswers, assets, reveals, busy, bindFocus, next, submit }: RoundProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [tiles, setTiles] = useState<number[]>([]);
  const [doubled, setDoubled] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const instructionsId = useId();
  const meta = templates[template];
  const item = items[index];
  const rows = template === "match-up" || template === "group-sort";
  const boxes = template === "open-box";
  const sequence = meta.kind === "sequence" || meta.kind === "word";
  const choice = meta.kind === "choice" || template === "find-match";
  const wheelPage = Math.floor(turn / 8) * 8;
  const wheelLabels = template === "wheel" ? order.slice(wheelPage, wheelPage + 8).map(i => items[i].prompt) : [];
  return rows ? <div className="play-stack" tabIndex={-1} ref={bindFocus}>
      <PairBoard items={items} answers={answers} grouping={template === "group-sort"}
        onAssign={(row, value) => setAnswers(previous => ({ ...previous, [row]: [value] }))}
        renderMedia={row => <><LessonMedia media={row.media} assets={assets} label={row.prompt}/><Pronunciation item={row} assets={assets}/></>}/>
      <button className="button primary" disabled={busy || items.some((_, i) => !answers[i]?.length)} onClick={() => void submit(answers)}>Hoàn thành</button>
    </div> : boxes ? <div className="play-stack" tabIndex={-1} ref={bindFocus}><div className="options">
      {items.map((box, i) => <div className="option-with-media" key={i}>
        <button className="option box" aria-expanded={i in answers} onClick={() => setAnswers({ ...answers, [i]: [] })}>
          <span className="box-lid" aria-hidden="true">✦</span><span>{i in answers ? reveals[i] : `Hộp ${i + 1}`}</span></button>
        {i in answers && <><LessonMedia media={box.media} assets={assets} label={reveals[i]}/><Pronunciation item={box} assets={assets}/></>}</div>)}</div>
      <button className="button primary" disabled={busy || Object.keys(answers).length !== items.length} onClick={() => void submit(answers)}>Hoàn thành</button>
    </div> : item && <div className="play-stack">
      <Progress value={turn + 1} total={items.length}/>
      {template === "wheel" ? <div className="wheel-prompt" tabIndex={-1} ref={bindFocus}>
        <Wheel key={turn} labels={wheelLabels} selected={turn - wheelPage} spun={flipped}/>
        {flipped && <h2>{item.prompt}</h2>}
      </div> : template === "flash-cards" ? <button ref={bindFocus} className="flash" aria-pressed={flipped} onClick={() => setFlipped(!flipped)}>
        <span className="flash-face" key={String(flipped)}>{flipped ? reveals[index] : item.prompt}</span><small>Lật thẻ</small>
      </button>
        : <h2 className="lesson-text" tabIndex={-1} ref={bindFocus}>{item.prompt}</h2>}
      {(template !== "wheel" || flipped) && <LessonMedia media={item.media} assets={assets} label={item.prompt}/>}
      {template === "flash-cards" && flipped && item.vocabulary && <div lang="en" className="lesson-text">
        {item.vocabulary.ipa && <p>{item.vocabulary.ipa}</p>}
        {item.vocabulary.example && <p>{item.vocabulary.example}</p>}
      </div>}
      {(template !== "wheel" || flipped) && <Pronunciation item={item} assets={assets}/>}
      {meta.kind === "blank" && <label>Từ cần điền<input value={selected[0] ?? ""} onChange={event => setSelected([event.target.value])}/></label>}
      {sequence && <><div className="sequence-output" aria-live="polite">{tiles.map((tile, position) =>
        <button key={tile} className="option" onClick={() => setTiles(tiles.filter((_, i) => i !== position))}>{item.options[tile]} <span aria-hidden="true">×</span></button>)}</div>
        <div className="options">{item.options.map((option, i) => <button className="option" key={i} disabled={tiles.includes(i)} onClick={() => setTiles([...tiles, i])}>{option}</button>)}</div></>}
      {choice && <><p id={instructionsId}>{item.multiple ? "Chọn tất cả đáp án đúng." : "Chọn một đáp án."}</p>
        <div className="options" role="group" aria-labelledby={instructionsId}>{item.options.map((option, position) => {
          const media = item.optionMedia?.find(entry => entry.option === option);
          return <div className="option-with-media" key={option}>
            <button className="option" aria-pressed={selected.includes(option)} onClick={() =>
              setSelected(selected.includes(option) ? selected.filter(value => value !== option) : item.multiple ? [...selected, option] : [option])}>
              <LessonMedia media={media?.image ? { image: media.image } : undefined} assets={assets} label=""/>
              {template === "quiz" && <span className="choice-letter" aria-hidden="true">{"ABCDEFGH"[position]}</span>}
              <span>{option}</span>
            </button>
            <LessonMedia media={media?.audio ? { audio: media.audio } : undefined} assets={assets} label={`Nghe phương án ${option}`}/>
          </div>;
        })}</div></>}
      <div className="inline-actions">
        {template === "gameshow" && !Object.values(answers).some(answer => answer.at(-1) === doubleMarker) &&
          <button className="button wager" aria-pressed={doubled} onClick={() => setDoubled(!doubled)}>Nhân đôi điểm câu này</button>}
        {sequence && tiles.length > 0 && <button className="button" onClick={() => setTiles(tiles.slice(0, -1))}><ArrowLeft size={16}/> Bỏ từ cuối</button>}
        {template === "wheel" && !flipped ? <button className="button primary" onClick={() => setFlipped(true)}>Quay vòng</button>
          : <button className="button primary" disabled={busy ||
            (sequence ? tiles.length !== item.options.length :
              (meta.kind === "blank" || meta.kind === "choice" || template === "find-match") && !selected[0]?.trim())}
            onClick={() => next(sequence ? tiles.map(tile => item.options[tile]) : doubled ? [...selected, doubleMarker] : selected)}>
            {busy ? "Đang nộp…" : turn + 1 === items.length ? "Hoàn thành" : "Tiếp theo"}</button>}
      </div>
    </div>;
}
