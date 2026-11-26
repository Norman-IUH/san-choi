"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, Maximize, RotateCcw } from "lucide-react";
import { finishAttempt, startAttempt } from "@/app/play/actions";
import { doubleMarker, grade, shuffle, templates, type Media, type Template, type Item, type PlayItem } from "@/lib/game";

type Props = { title: string; template: Template; initialItems?: PlayItem[]; reveals?: string[];
  localContent?: Item[]; assignment?: string; requireName?: boolean; assets?: Record<string, string> };

function LessonMedia({ media, assets, label }: { media?: Media; assets: Record<string, string>; label: string }) {
  const image = media?.image && assets[media.image];
  const audio = media?.audio && assets[media.audio];
  return <>{image && (
    // eslint-disable-next-line @next/next/no-img-element -- Private signed media is served directly by Storage.
    <img className="lesson-image" src={image} alt={label} />
  )}{audio && <audio aria-label={label} controls preload="none" src={audio}/>}</>;
}

export function Player({ title, template, initialItems = [], reveals: initialReveals = [], localContent, assignment, requireName, assets: initialAssets = {} }: Props) {
  const [items, setItems] = useState(initialItems);
  const [reveals, setReveals] = useState(initialReveals);
  const [assets, setAssets] = useState(initialAssets);
  const [active, setActive] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [turn, setTurn] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [tiles, setTiles] = useState<number[]>([]);
  const [doubled, setDoubled] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ score: number | null; total: number } | null>(null);
  const [feedback, setFeedback] = useState("");
  const focusTarget = useRef<HTMLElement | null>(null);
  const replayPending = useRef(false);
  const progressId = useId();
  const instructionsId = useId();
  const outcomeId = useId();
  const bindFocus = (node: HTMLElement | null) => { focusTarget.current = node; };
  const meta = templates[template];
  const index = order[turn] ?? 0;
  const item = items[index];
  const rows = template === "match-up" || template === "group-sort";
  const boxes = template === "open-box";
  const sequence = meta.kind === "sequence" || meta.kind === "word";
  const choice = meta.kind === "choice" || template === "find-match";

  useEffect(() => {
    if (active || replayPending.current) focusTarget.current?.focus();
    replayPending.current = false;
  }, [active, turn, result]);

  async function start() {
    setBusy(true);
    setError("");
    try {
      const started = assignment ? await startAttempt(assignment, nickname) : { items: initialItems, reveals: initialReveals, assets: initialAssets };
      if ("error" in started && started.error) { setError(started.error); return; }
      if (!started.items?.length) { setError("Hoạt động chưa có nội dung."); return; }
      const indexes = started.items.map((_, i) => i);
      setItems(started.items);
      setReveals(started.reveals ?? []);
      setAssets(started.assets ?? {});
      setOrder(template === "wheel" ? shuffle(indexes) : indexes);
      setTurn(0);
      setSelected([]);
      setAnswers({});
      setTiles([]);
      setDoubled(false);
      setFlipped(false);
      setResult(null);
      setFeedback("");
      setActive(true);
    } catch { setError("Không kết nối được. Hãy thử lại."); }
    finally { setBusy(false); }
  }

  async function submit(responses: Record<number, string[]>) {
    setAnswers(responses);
    setBusy(true);
    setError("");
    try {
      const ordered = items.map((_, i) => responses[i] ?? []);
      const response = assignment ? await finishAttempt(assignment, ordered) : grade(template, localContent ?? [], ordered);
      if ("error" in response && response.error) { setError(response.error); return; }
      if ("score" in response) setResult({ score: response.score, total: response.total });
    } catch { setError("Mất kết nối. Bạn có thể thử nộp lại."); }
    finally { setBusy(false); }
  }

  function next(answer: string[]) {
    const updated = { ...answers, [index]: answer };
    if (!assignment && localContent) {
      const { correct } = grade(template, [localContent[index]], [answer]);
      if (correct[0] !== null) {
        const explanation = localContent[index].explanation;
        setFeedback(`Mục ${turn + 1}: ${correct[0] ? "Chính xác!" : "Chưa chính xác."}${explanation ? " " + explanation : ""}`);
      }
    }
    if (turn + 1 === items.length) { void submit(updated); return; }
    setAnswers(updated);
    setTurn(turn + 1);
    setSelected([]);
    setTiles([]);
    setDoubled(false);
    setFlipped(false);
  }

  return <section className={`player ${template === "gameshow" ? "gameshow" : ""}`}>
    <div className="player-top"><span className={`template-tag ${meta.color}`}>{meta.icon} &nbsp;{meta.title}</span>
      <button type="button" className="icon-button" aria-label="Toàn màn hình" onClick={event => {
        const panel = event.currentTarget.closest("section");
        void (document.fullscreenElement ? document.exitFullscreen() : panel?.requestFullscreen())?.catch(() => setError("Thiết bị chưa hỗ trợ chế độ toàn màn hình."));
      }}><Maximize size={19}/></button>
    </div>
    <h1>{title}</h1>
    {error && <p role="alert" className="notice error">{error}</p>}
    <p role="status" aria-atomic="true" className={feedback ? "notice" : "sr-only"}>
      {feedback}
    </p>
    {result ? <div className="result"><h2 tabIndex={-1} ref={bindFocus}
      aria-describedby={result.score !== null || assignment ? outcomeId : undefined}>Hoàn thành!</h2>
      {result.score !== null && <strong id={outcomeId}>{result.score}/{result.total} điểm</strong>}
      {assignment && <p id={result.score === null ? outcomeId : undefined}>Bài làm đã được lưu.</p>}
      <button className="button primary" onClick={() => {
        replayPending.current = true;
        setResult(null);
        setActive(false);
        setFeedback("");
      }}><RotateCcw size={16}/> Chơi lại</button>
    </div> : !active ? <form onSubmit={event => { event.preventDefault(); void start(); }}>
      {assignment && requireName && <label>Biệt danh<input value={nickname} onChange={event => setNickname(event.target.value)} maxLength={80} required /></label>}
      <button ref={bindFocus} className="button primary" disabled={busy}>{busy ? "Đang mở…" : "Bắt đầu"}</button>
    </form> : rows ? <div className="play-stack" tabIndex={-1} ref={bindFocus}>
      {items.map((row, i) => <div className="stack" key={i}><LessonMedia media={row.media} assets={assets} label={row.prompt}/>
        <label className="match-row">{row.prompt}
        <select value={answers[i]?.[0] ?? ""} onChange={event => setAnswers({ ...answers, [i]: event.target.value ? [event.target.value] : [] })}>
          <option value="">{template === "group-sort" ? "Chọn nhóm" : "Chọn cặp"}</option>
          {row.options.map(option => <option key={option}>{option}</option>)}
        </select></label></div>)}
      <button className="button primary" disabled={busy || items.some((_, i) => !answers[i]?.length)} onClick={() => void submit(answers)}>Hoàn thành</button>
    </div> : boxes ? <div className="play-stack" tabIndex={-1} ref={bindFocus}><div className="options">
      {items.map((box, i) => <div className="option-with-media" key={i}>
        <button className="option box" aria-expanded={i in answers} onClick={() => setAnswers({ ...answers, [i]: [] })}>
          {i in answers ? reveals[i] : `Hộp ${i + 1}`}</button>
        {i in answers && <LessonMedia media={box.media} assets={assets} label={reveals[i]}/>}</div>)}</div>
      <button className="button primary" disabled={busy || Object.keys(answers).length !== items.length} onClick={() => void submit(answers)}>Hoàn thành</button>
    </div> : item && <div className="play-stack">
      <div className="progress-label"><span id={progressId}>Mục {turn + 1} / {items.length}</span><progress aria-labelledby={progressId} value={turn + 1} max={items.length}/></div>
      {template === "wheel" ? <div className="wheel-prompt" tabIndex={-1} ref={bindFocus}>
        <div className={flipped ? "wheel spun" : "wheel"} aria-hidden="true">✦</div>
        {flipped && <h2>{item.prompt}</h2>}
      </div> : template === "flash-cards" ? <button ref={bindFocus} className="flash" aria-pressed={flipped} onClick={() => setFlipped(!flipped)}>{flipped ? reveals[index] : item.prompt}<small>Lật thẻ</small></button>
        : <h2 className="lesson-text" tabIndex={-1} ref={bindFocus}>{item.prompt}</h2>}
      {(template !== "wheel" || flipped) && <LessonMedia media={item.media} assets={assets} label={item.prompt}/>}
      {template === "flash-cards" && flipped && item.vocabulary && <div lang="en" className="lesson-text">
        {item.vocabulary.ipa && <p>{item.vocabulary.ipa}</p>}
        {item.vocabulary.example && <p>{item.vocabulary.example}</p>}
      </div>}
      {(template !== "wheel" || flipped) && (["uk", "us"] as const).map(accent => {
        const path = item.pronunciation?.[accent];
        const label = accent === "uk" ? "Anh–Anh" : "Anh–Mỹ";
        return path && assets[path] && <div key={accent} className="pronunciation"><strong>{label}</strong>
          <audio aria-label={label} controls preload="none" src={assets[path]}/></div>;
      })}
      {meta.kind === "blank" && <label>Từ cần điền<input value={selected[0] ?? ""} onChange={event => setSelected([event.target.value])}/></label>}
      {sequence && <><div className="sequence-output" aria-live="polite">{tiles.map((tile, position) =>
        <button key={tile} className="option" onClick={() => setTiles(tiles.filter((_, i) => i !== position))}>{item.options[tile]} <span aria-hidden="true">×</span></button>)}</div>
        <div className="options">{item.options.map((option, i) => <button className="option" key={i} disabled={tiles.includes(i)} onClick={() => setTiles([...tiles, i])}>{option}</button>)}</div></>}
      {choice && <><p id={instructionsId}>{item.multiple ? "Chọn tất cả đáp án đúng." : "Chọn một đáp án."}</p>
        <div className="options" role="group" aria-labelledby={instructionsId}>{item.options.map(option => {
          const media = item.optionMedia?.find(entry => entry.option === option);
          return <div className="option-with-media" key={option}>
            <button className="option" aria-pressed={selected.includes(option)} onClick={() =>
              setSelected(selected.includes(option) ? selected.filter(value => value !== option) : item.multiple ? [...selected, option] : [option])}>
              <LessonMedia media={media?.image ? { image: media.image } : undefined} assets={assets} label=""/>
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
    </div>}
  </section>;
}
