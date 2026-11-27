"use client";
import { useId, useState } from "react";
import { colourPalette } from "@/lib/games/practice";
import { cambridgeResponseLimit, cambridgePartNames } from "@/lib/games/starters";
import { LessonMedia } from "./LessonMedia";
import type { RoundProps } from "./LegacyRound";

export default function StartersRound({ items, index, turn, answers, assets, setAnswers, next, busy, bindFocus }: RoundProps) {
  const item = items[index];
  const config = item.practice!.starters!;
  const { paper, part, scene, cards, targets, letters, passage, guide, example, fields, lead, choices, copyWord, open, sign, signPosition,
    visuals, groups, wordBank, responses, exchange } = config;
  const level = config.level ?? "starters";
  const advanced = level !== "starters";
  const match = paper === "listening" && part === 1;
  const colouring = paper === "listening" && part === (advanced ? 5 : 4);
  const paint = colouring && !sign;
  const speaking = paper === "speaking";
  const tick = !advanced && paper === "reading" && part === 1;
  const typed = paper === "listening" && part === 2 || paper === "reading" &&
    (advanced ? copyWord || part >= 5 : [2, 3, 4, 5].includes(part));
  const value = answers[index]?.[0] ?? "";
  const [target, setTarget] = useState(value.split(":")[0]);
  const [card, setCard] = useState(paint ? value.split(":")[1] ?? "" : "");
  const [word, setWord] = useState("");
  const [zoom, setZoom] = useState<string>();
  const [asking, setAsking] = useState(false);
  const inputId = useId();
  const palette = ["blue", "red", "green", "yellow", "orange", "pink", "purple", "brown"] as const;
  const section = items.flatMap((row, i) => row.practice?.starters?.part === part && row.practice.starters.paper === paper ? [i] : []);
  const previous = section.filter(i => i !== index).map(i => answers[i]?.[0] ?? "");
  const heading = cambridgePartNames[level][paper][part - 1];
  function pick(answer: string) {
    setAnswers(old => ({ ...old, [index]: answer ? [answer] : [] }));
  }
  function pickWord(answer: string) {
    if (!copyWord) return pick(answer);
    setWord(answer);
    document.getElementById(inputId)?.focus();
  }
  function signField(position?: "left" | "right") {
    const current = sign && signPosition === position;
    const signIndex = section.find(i => items[i].practice?.starters?.sign && items[i].practice?.starters?.signPosition === position);
    const className = position ? `mover-sign flyer-sign-${position}` : "mover-sign";
    return current ? <label className={className}><span className="sr-only">{position ? `Word on the ${position} sign` : "Word on the sign"}</span>
      <input value={value} onChange={event => pick(event.target.value)} maxLength={40} spellCheck={false} autoComplete="off"/>
    </label> : <span className={className} aria-hidden="true">{signIndex !== undefined && answers[signIndex]?.[0]}</span>;
  }
  return <form className="starter-sheet" lang="en" onSubmit={event => {
    event.preventDefault();
    // Card placement is a teaching aid. The teacher assesses the spoken work.
    next(groups ? answers[index] ?? [] : !speaking && value.trim() ? [value.trim()] : []);
  }}>
    <div>
      <p className="starter-label" lang="vi">Part {part} · {heading}</p>
      <h2 ref={bindFocus} tabIndex={-1}>{item.prompt}</h2>
    </div>
    {(guide || example) && <details className="starter-guide" lang="vi">
      <summary>{config.mock ? "Ví dụ mẫu" : "Gợi ý luyện tập"}</summary><p>{guide ?? example}</p>
    </details>}
    {speaking && <p className="starter-guide" lang="vi">Làm phần này cùng giáo viên. Em có thể trả lời trực tiếp bằng lời.</p>}
    {visuals && <div className="mover-scenes">
      {visuals.map((src, i) => {
        const caption = visuals.length === 2 ? `Picture ${"AB"[i]}` : `Picture ${i + 1}`;
        return <figure key={src} data-enlarged={zoom === src || undefined}>
          <button type="button" aria-label={`Enlarge ${caption}`} aria-pressed={zoom === src} onClick={() => setZoom(zoom === src ? undefined : src)}>
            <LessonMedia media={{ image: src }} assets={assets} label={`Scene ${i + 1}`}/>
          </button>
          <figcaption>{caption}</figcaption>
        </figure>;
      })}
    </div>}
    {exchange && <section className="flyer-exchange" aria-label="Information exchange">
      <div className="starter-buttons">
        <button type="button" aria-pressed={!asking} onClick={() => setAsking(false)}>Answer the examiner</button>
        <button type="button" aria-pressed={asking} onClick={() => setAsking(true)}>Ask the examiner</button>
      </div>
      <div className="flyer-exchange-card">
        <figure><LessonMedia media={{ image: asking ? exchange.examiner.image : exchange.learner.image }} assets={assets}
          label={asking ? exchange.examiner.value : exchange.learner.value}/>
          <figcaption>{asking ? exchange.examiner.value : exchange.learner.value}</figcaption></figure>
        <dl className="mover-booking">{exchange.rows.map(row => <div key={row.label}><dt>{row.label}</dt>
          <dd>{asking ? "?" : row.value}</dd></div>)}</dl>
      </div>
      <p lang="vi">{asking ? "Đặt câu hỏi để tìm thông tin còn thiếu." : "Dùng phiếu của em để trả lời câu hỏi của giáo viên."}</p>
    </section>}
    {groups?.map((group, i) => <fieldset key={i} className="mover-odd">
      <legend>Set {i + 1}</legend>
      <div className="starter-cards">{group.map((src, n) => <button key={src} className="starter-card" type="button"
        aria-pressed={answers[index]?.[i] === String(n)} onClick={() => setAnswers(old => ({
          ...old, [index]: groups.map((_, groupIndex) => groupIndex === i ? String(n) : old[index]?.[groupIndex] ?? ""),
        }))}>
        <LessonMedia media={{ image: src }} assets={assets} label={src.split("/").at(-1)!.replace(".webp", "")}/>
        <span>{"ABCD"[n]}</span>
      </button>)}</div>
    </fieldset>)}
    {passage && <div className="starter-passage">{passage}</div>}
    {fields && <dl className="mover-booking">{fields.map((name, i) => <div key={name} aria-current={section[i] === index ? "step" : undefined}>
      <dt>{name}</dt><dd>{answers[section[i]]?.[0] || "—"}</dd>
    </div>)}</dl>}
    {scene && (targets ? <div className="starter-scene">
      <LessonMedia media={{ image: scene }} assets={assets}
        label={level === "flyers" ? (colouring ? "A beach hut with two empty signs" : "Six children at the coastal centre") :
          advanced ? (colouring ? "A fair stall with an empty sign" : "Six children at the fair") :
          (paint ? "Seven balls in a park" : "Six children in a park")}/>
      {advanced && colouring && (level === "flyers" ? <>{signField("left")}{signField("right")}</> : signField())}
      {match && value && <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="50" y1="4"
        x2={targets.find(point => point.id === value)?.x} y2={targets.find(point => point.id === value)?.y}/></svg>}
      {targets.map(point => {
        const paintValue = (value.startsWith(point.id + ":") ? value : previous.find(answer => answer.startsWith(point.id + ":")))?.split(":")[1];
        const taken = match ? previous.includes(point.id) : paint && previous.some(answer => answer.startsWith(point.id + ":"));
        const fill = paintValue ? colourPalette[paintValue] : undefined;
        const mask = point.mask && assets[point.mask];
        return <div key={point.id}>
          {mask && fill && <span className="mover-colour-fill" aria-hidden="true" style={{ backgroundColor: fill, maskImage: `url(${mask})` }}/>}
          <button className={mask ? "starter-pin mover-colour-pin" : "starter-pin"} type="button"
          aria-label={`${colouring ? (advanced ? "Object" : "Ball") : "Person"} ${point.id}${paintValue ? " " + paintValue : ""}`}
          aria-pressed={target === point.id} style={{ left: point.x + "%", top: point.y + "%",
            backgroundColor: mask ? undefined : fill }}
          disabled={taken || sign} onClick={() => {
            setTarget(point.id);
            if (match) pick(point.id);
            if (paint) pick(card ? point.id + ":" + card : "");
            if (speaking && card) {
              setAnswers(old => ({ ...old, [index]: [...(old[index] ?? []).filter(entry => entry.split(":")[1] !== card), point.id + ":" + card] }));
              setCard("");
            }
          }}>{point.id}{speaking && answers[index]?.some(entry => entry.startsWith(point.id + ":")) && <span aria-hidden="true"> ✓</span>}</button>
        </div>;
      })}
    </div> : <div className={!advanced && paper === "reading" && [1, 3].includes(part) ? "starter-picture starter-object" : "starter-picture"}><LessonMedia media={{ image: scene }} assets={assets}
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
    {lead && <ul className="mover-matches" aria-label="People to match">
      {section.map(i => {
        const person = items[i].practice?.starters?.lead;
        return person && <li key={i} aria-current={i === index ? "step" : undefined}>
          <LessonMedia media={{ image: person.image }} assets={assets} label=""/>
          <span>{person.value}{answers[i]?.[0] ? ` · ${answers[i][0]}` : ""}</span>
        </li>;
      })}
    </ul>}
    {cards && <div className={cards.length === 3 ? "starter-cards starter-three" : "starter-cards"}>
      {cards.map(entry => {
        const picture = <LessonMedia media={{ image: entry.image }} assets={assets} label={speaking ? entry.value : ""}/>;
        return speaking && part !== 1 ? <div key={entry.value} className="starter-card">{picture}</div> :
          <button key={entry.value} type="button" className="starter-card" aria-label={entry.value}
            disabled={!!lead && previous.includes(entry.value)} aria-pressed={(speaking ? card : copyWord ? word : value) === entry.value} onClick={() => {
          if (speaking) setCard(entry.value);
          else pickWord(entry.value);
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
    {choices && <div className="starter-buttons" aria-label="Answer choices">
      {choices.map((choice, i) => <button key={i} type="button" aria-pressed={(copyWord ? word : value) === choice} onClick={() => pickWord(choice)}>
        {!copyWord && <span className="starter-choice-letter" aria-hidden="true">{"ABC"[i]}</span>}{choice}
      </button>)}
    </div>}
    {wordBank && <div className="starter-buttons" aria-label="Word bank">
      {wordBank.map(entry => <button key={entry} type="button" aria-pressed={word === entry} onClick={() => pickWord(entry)}>{entry}</button>)}
    </div>}
    {responses && <div className="starter-buttons flyer-responses" aria-label="Responses A to H">
      {responses.map((response, i) => {
        const letter = "ABCDEFGH"[i];
        return <button type="button" key={letter} aria-pressed={value === letter} disabled={previous.includes(letter)}
          onClick={() => pick(letter)}><span className="starter-choice-letter">{letter}</span>{response}</button>;
      })}
    </div>}
    {typed && <label className="starter-answer">Your answer
      {open ? <textarea id={inputId} value={value} onChange={event => pick(event.target.value)} rows={level === "flyers" ? 6 : 3}
        maxLength={cambridgeResponseLimit(config)} spellCheck={false}/> :
        <input id={inputId} value={value} onChange={event => pick(event.target.value)} placeholder={letters && "– ".repeat(letters.length).trim()} autoComplete="off" autoCorrect="off"
          autoCapitalize="off" spellCheck={false} maxLength={cambridgeResponseLimit(config)}/>}
    </label>}
    <button className="button primary" lang="vi" disabled={busy}>{turn + 1 === items.length ? "Nộp bài" : "Tiếp theo"}</button>
  </form>;
}
