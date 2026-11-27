"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { lineBetween } from "@/lib/games/word-puzzles";
import { normalize } from "@/lib/games/model";
import { truthOptions } from "@/lib/games/word-templates";
import { LessonMedia, Pronunciation } from "./LessonMedia";
import type { RoundProps } from "./LegacyRound";

export default function WordRound({ template, items, index, turn, next, busy, assets, bindFocus, guess }: RoundProps) {
  const item = items[index];
  const [value, setValue] = useState("");
  const [endpoint, setEndpoint] = useState<number>();
  const [path, setPath] = useState<number[]>([]);
  const [magnets, setMagnets] = useState<number[]>([]);
  const [guessed, setGuessed] = useState<string[]>(item.hangman?.guesses ?? []);
  const [hangman, setHangman] = useState(item.hangman ?? { pattern: Array<string>(item.letters ?? 0).fill(""), misses: 0 });
  const [guessing, setGuessing] = useState(false);
  const [guessError, setGuessError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const endLabel = turn + 1 === items.length ? "Hoàn thành" : "Tiếp theo";

  function finish(answer: string[], enabled: boolean) {
    return <button type="button" className="button primary" onClick={() => next(answer)} disabled={busy || !enabled}>
      {busy ? "Đang nộp…" : endLabel}
    </button>;
  }

  const media = <><LessonMedia media={item.media} assets={assets} label={item.prompt}/><Pronunciation item={item} assets={assets}/></>;
  let game: ReactNode;
  switch (template) {
    case "type-answer":
    case "spell-word": {
      const spelling = template === "spell-word";
      const valid = spelling ? value.length === item.letters : value.trim().length > 0;
      game = <form className="word-entry" onSubmit={event => {
        event.preventDefault();
        if (valid && !busy) next([value]);
      }}>
        {spelling && <div className="spell-cells" aria-hidden="true">{Array.from({ length: item.letters ?? 0 }, (_, i) =>
          <span key={i}>{value[i] ?? "·"}</span>)}</div>}
        <label>{spelling ? "Đánh vần" : "Câu trả lời"}<input lang="en" autoComplete="off" autoCapitalize="none" spellCheck={false}
          maxLength={spelling ? item.letters : 400} value={value}
          onChange={event => setValue(spelling ? event.target.value.replace(/[^a-z]/gi, "").toUpperCase() : event.target.value)}/></label>
        <button className="button primary" disabled={busy || !valid}>{busy ? "Đang nộp…" : endLabel}</button>
      </form>;
      break;
    }
    case "true-false":
      game = <><div className="truth-balance" role="group" aria-label="Đúng hay sai">
        {truthOptions.map(option => {
          const media = item.optionMedia?.find(entry => normalize(entry.option) === normalize(option));
          return <div key={option} className="option-with-media">
            <button aria-pressed={value === option} onClick={() => setValue(option)} className="option" aria-label={option}>
              <LessonMedia assets={assets} media={{ image: media?.image }} label=""/>
              <b aria-hidden="true">{option === "True" ? "✓" : "×"}</b>{option}
            </button><LessonMedia assets={assets} media={{ audio: media?.audio }} label={"Nghe " + option}/>
          </div>;
        })}
      </div>{finish([value], Boolean(value))}</>;
      break;
    case "wordsearch": {
      const grid = item.grid!;
      game = <><div className="wordsearch-board" role="group" aria-label="Lưới tìm từ" style={{ gridTemplateColumns: "repeat(" + grid.size + ", minmax(0, 1fr))" }}>
        {grid.letters.map((letter, position) => <button className="option" key={position} type="button"
          aria-pressed={endpoint === position || path.includes(position)} aria-label={letter + ", ô " + (position + 1)}
          onClick={() => {
            if (endpoint === undefined) { setEndpoint(position); setPath([]); }
            else { setPath(lineBetween(endpoint, position, grid.size)); setEndpoint(undefined); }
          }}>{letter}</button>)}
      </div>
      <p role="status">Từ đã chọn <strong>{path.map(position => grid.letters[position]).join("") || "—"}</strong></p>
      {finish([path.map(position => grid.letters[position]).join("")], path.length >= 2)}</>;
      break;
    }
    case "hangman": {
      const won = hangman.pattern.every(Boolean);
      const lost = hangman.misses >= 6;
      async function choose(letter: string) {
        if (guessing || guessed.includes(letter) || won || lost) return;
        setGuessing(true);
        setGuessError(false);
        const selected = [...guessed, letter];
        try {
          const result = await guess?.(letter, selected);
          if (!result) { setGuessError(true); return; }
          setGuessed(result.guesses);
          setHangman(result);
        } catch { setGuessError(true); }
        finally { setGuessing(false); }
      }
      game = <div className="hangman-board">
        <span className="hangman-kite" aria-hidden="true" style={{ rotate: -7 * hangman.misses + "deg" }}>◇</span>
        <p role="status">Còn {6 - hangman.misses} lượt sai. Từ đang đoán {hangman.pattern.map(letter => letter || "…").join(" ")}</p>
        <div className="spell-cells" aria-hidden="true">{hangman.pattern.map((letter, i) => <span key={i}>{letter || "·"}</span>)}</div>
        {guessError && <p role="alert">Chưa kiểm tra được chữ cái. Hãy thử lại.</p>}
        <div className="alphabet" role="group" aria-label="Bảng chữ cái"
          onKeyDown={event => { if (/^[a-z]$/i.test(event.key)) void choose(event.key.toUpperCase()); }}>
          {Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ", letter => <button className="option" key={letter} disabled={guessing || won || lost || guessed.includes(letter)}
            onClick={() => void choose(letter)}>{letter}</button>)}
        </div>{finish(won ? [hangman.pattern.join("")] : [], won || lost)}
      </div>;
      break;
    }
    case "word-magnets": {
      function place(index: number) {
        if (item.options[index] !== undefined && !magnets.includes(index)) setMagnets([...magnets, index]);
      }
      game = <><div className="magnet-board" role="group" aria-label="Câu của em" onDragOver={event => event.preventDefault()}
        onDrop={event => {
          event.preventDefault();
          const source = event.dataTransfer.getData("application/x-sanchoi-magnet");
          if (source) place(Number(source));
        }}>
        {magnets.length === 0 && <p>Thả nam châm vào đây.</p>}
        {magnets.map((tile, position) => <div key={tile} className="magnet-placed">
          <button className="option" onClick={() => setMagnets(magnets.filter(index => index !== tile))} aria-label={"Bỏ " + item.options[tile]}>{item.options[tile]}</button>
          <button className="magnet-shift" disabled={position === 0} aria-label={"Đưa " + item.options[tile] + " sang trái"}
            onClick={() => { const moved = [...magnets]; [moved[position - 1], moved[position]] = [moved[position], moved[position - 1]]; setMagnets(moved); }}>←</button>
        </div>)}
      </div><div className="magnet-pool" role="group" aria-label="Nam châm từ">
        {item.options.map((option, i) => <button className="option" key={i} draggable={!magnets.includes(i)} disabled={magnets.includes(i)}
          onDragStart={event => event.dataTransfer.setData("application/x-sanchoi-magnet", String(i))}
          onClick={() => place(i)}>{option}</button>)}
      </div>{finish(magnets.map(i => item.options[i]), magnets.length === item.options.length)}</>;
      break;
    }
  }
  return <div className="play-stack word-round">
    <h2 className="lesson-text" lang="en" tabIndex={-1} ref={node => { heading.current = node; bindFocus(node); }}>{item.prompt}</h2>
    {media}
    {game}
  </div>;
}
