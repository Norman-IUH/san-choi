"use client";
import { useState } from "react";
import { colourPalette } from "@/lib/games/practice";
import { starterPartNames } from "@/lib/games/starters";
import { LessonMedia } from "./LessonMedia";
import type { RoundProps } from "./LegacyRound";

export default function StartersRound({ items, index, turn, answers, assets, setAnswers, next, busy, bindFocus }: RoundProps) {
  const item = items[index];
  const config = item.practice!.starters!;
  const { paper, part, scene, cards, targets, letters, passage, guide, example } = config;
  const match = paper === "listening" && part === 1;
  const paint = paper === "listening" && part === 4;
  const speaking = paper === "speaking";
  const tick = paper === "reading" && part === 1;
  const typed = paper === "listening" && part === 2 || paper === "reading" && [2, 3, 4, 5].includes(part);
  const value = answers[index]?.[0] ?? "";
  const [target, setTarget] = useState(value.split(":")[0]);
  const [card, setCard] = useState(paint ? value.split(":")[1] ?? "" : "");
  const palette = ["blue", "red", "green", "yellow", "orange", "pink", "purple", "brown"] as const;
  const previous = items.flatMap((row, i) => i !== index && row.practice?.starters?.part === part && row.practice.starters.paper === paper
    ? [answers[i]?.[0] ?? ""] : []);
  const heading = starterPartNames[paper][part - 1];
  function pick(answer: string) {
    setAnswers(old => ({ ...old, [index]: answer ? [answer] : [] }));
  }
  return <form className="starter-sheet" lang="en" onSubmit={event => {
    event.preventDefault();
    // Card placement is a teaching aid. The teacher assesses the spoken work.
    next(!speaking && value.trim() ? [value.trim()] : []);
  }}>
    <div>
      <p className="starter-label" lang="vi">Part {part} · {heading}</p>
      <h2 ref={bindFocus} tabIndex={-1}>{item.prompt}</h2>
    </div>
    {(guide || example) && <details className="starter-guide" lang="vi">
      <summary>{config.mock ? "Ví dụ mẫu" : "Gợi ý luyện tập"}</summary><p>{guide ?? example}</p>
    </details>}
    {speaking && <p className="starter-guide" lang="vi">Làm phần này cùng giáo viên. Em có thể trả lời trực tiếp bằng lời.</p>}
    {passage && <div className="starter-passage">{passage}</div>}
    {scene && (targets ? <div className="starter-scene">
      <LessonMedia media={{ image: scene }} assets={assets} label={paint ? "Seven balls in a park" : "Six children in a park"}/>
      {match && value && <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="50" y1="4"
        x2={targets.find(point => point.id === value)?.x} y2={targets.find(point => point.id === value)?.y}/></svg>}
      {targets.map(point => {
        const paintValue = (value.startsWith(point.id + ":") ? value : previous.find(answer => answer.startsWith(point.id + ":")))?.split(":")[1];
        const taken = match ? previous.includes(point.id) : paint && previous.some(answer => answer.startsWith(point.id + ":"));
        return <button className="starter-pin" type="button" key={point.id} aria-label={`${paint ? "Ball" : "Person"} ${point.id}${paintValue ? " " + paintValue : ""}`}
          aria-pressed={target === point.id} style={{ left: point.x + "%", top: point.y + "%",
            backgroundColor: paintValue ? colourPalette[paintValue as keyof typeof colourPalette] : undefined }}
          disabled={taken} onClick={() => {
            setTarget(point.id);
            if (match) pick(point.id);
            if (paint) pick(card ? point.id + ":" + card : "");
            if (speaking && card) {
              setAnswers(old => ({ ...old, [index]: [...(old[index] ?? []).filter(entry => entry.split(":")[1] !== card), point.id + ":" + card] }));
              setCard("");
            }
          }}>{point.id}{speaking && answers[index]?.some(entry => entry.startsWith(point.id + ":")) && <span aria-hidden="true"> ✓</span>}</button>;
      })}
    </div> : <div className={paper === "reading" && [1, 3].includes(part) ? "starter-picture starter-object" : "starter-picture"}><LessonMedia media={{ image: scene }} assets={assets}
      label={paper === "reading" && part === 5 ? "Story picture" : "Question picture"}/></div>)}
    {speaking && part === 1 && !!answers[index]?.length && <ul className="starter-placements" aria-label="Placed cards">
      {answers[index].map(entry => { const [person, object] = entry.split(":"); return <li key={object}>{object} → {person}</li>; })}
    </ul>}
    {paint && <div className="starter-buttons" aria-label="Colours">
      {palette.map(colour => <button key={colour} type="button" aria-pressed={card === colour} onClick={() => {
        setCard(colour);
        if (target) pick(target + ":" + colour);
      }}><span className="starter-swatch" aria-hidden="true" style={{ backgroundColor: colourPalette[colour] }}/>{colour}</button>)}
    </div>}
    {cards && <div className={cards.length === 3 ? "starter-cards starter-three" : "starter-cards"}>
      {cards.map(entry => {
        const picture = <LessonMedia media={{ image: entry.image }} assets={assets} label={speaking ? entry.value : ""}/>;
        return speaking && part !== 1 ? <div key={entry.value} className="starter-card">{picture}</div> :
          <button key={entry.value} type="button" className="starter-card" aria-label={entry.value}
            aria-pressed={(speaking ? card : value) === entry.value} onClick={() => {
          if (speaking) setCard(entry.value);
          else pick(entry.value);
        }}>{picture}<span>{entry.value}</span></button>;
      })}
    </div>}
    {tick && <div className="starter-buttons">
      <button type="button" aria-pressed={value === "tick"} onClick={() => pick("tick")}>✓ Tick</button>
      <button type="button" aria-pressed={value === "cross"} onClick={() => pick("cross")}>✗ Cross</button>
    </div>}
    {letters && <div className="starter-buttons" aria-label={`Letter tiles, ${letters.length} letters`}>
      {[...letters].map((letter, n) => <button key={n} type="button"
        disabled={[...letters.slice(0, n + 1)].filter(tile => tile === letter).length <= [...value].filter(tile => tile === letter).length}
        onClick={() => pick(value + letter)}>{letter}</button>)}
      <button type="button" disabled={!value} onClick={() => pick(value.slice(0, -1))}>⌫</button>
    </div>}
    {typed && <label className="starter-answer">Your answer
      <input value={value} onChange={event => pick(event.target.value)} placeholder={letters && "– ".repeat(letters.length).trim()} autoComplete="off" autoCorrect="off"
        autoCapitalize="off" spellCheck={false} maxLength={40}/>
    </label>}
    <button className="button primary" lang="vi" disabled={busy}>{turn + 1 === items.length ? "Nộp bài" : "Tiếp theo"}</button>
  </form>;
}
