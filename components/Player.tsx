"use client";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, Maximize, Minimize, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { finishAttempt, startAttempt } from "@/app/play/actions";
import { doubleMarker, grade, missedReview, shuffle, templates, type Media, type Template, type Item, type PlayItem, type ReviewEntry } from "@/lib/game";
import { PairBoard } from "./games/PairBoard";
import { Wheel } from "./games/Wheel";
import { gameTheme } from "./games/game-themes";

type Props = { title: string; template: Template; initialItems?: PlayItem[]; reveals?: string[];
  localContent?: Item[]; assignment?: string; requireName?: boolean; assets?: Record<string, string> };

const subscribeToNothing = () => () => {};

function LessonMedia({ media, assets, label }: { media?: Media; assets: Record<string, string>; label: string }) {
  const image = media?.image && assets[media.image];
  const audio = media?.audio && assets[media.audio];
  return <>{image && (
    // eslint-disable-next-line @next/next/no-img-element -- Private signed media is served directly by Storage.
    <img className="lesson-image" src={image} alt={label} />
  )}{audio && <audio aria-label={label} controls preload="none" src={audio}/>}</>;
}

function Pronunciation({ item, assets }: { item: PlayItem; assets: Record<string, string> }) {
  return <>{(["uk", "us"] as const).map(accent => {
    const path = item.pronunciation?.[accent];
    const label = accent === "uk" ? "Anh–Anh" : "Anh–Mỹ";
    return path && assets[path] && <div key={accent} className="pronunciation"><strong>{label}</strong>
      <audio aria-label={label} controls preload="none" src={assets[path]}/></div>;
  })}</>;
}

export function Player({ title, template, initialItems = [], reveals: initialReveals = [], localContent, assignment, requireName, assets: initialAssets = {} }: Props) {
  const ready = useSyncExternalStore(subscribeToNothing, () => true, () => false);
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
  const [result, setResult] = useState<{ score: number | null; total: number; review?: ReviewEntry[] } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [sound, setSound] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [classroomFallback, setClassroomFallback] = useState(false);
  const draftId = useRef<string | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const focusTarget = useRef<HTMLElement | null>(null);
  const replayPending = useRef(false);
  const progressId = useId();
  const instructionsId = useId();
  const outcomeId = useId();
  const draftKey = assignment ? `san-choi-draft:${assignment}` : null;
  const bindFocus = (node: HTMLElement | null) => { focusTarget.current = node; };
  const meta = templates[template];
  const theme = gameTheme(template);
  const index = order[turn] ?? 0;
  const item = items[index];
  const rows = template === "match-up" || template === "group-sort";
  const boxes = template === "open-box";
  const sequence = meta.kind === "sequence" || meta.kind === "word";
  const choice = meta.kind === "choice" || template === "find-match";
  const wheelPage = Math.floor(turn / 8) * 8;
  const wheelLabels = template === "wheel" ? order.slice(wheelPage, wheelPage + 8).map(i => items[i].prompt) : [];
  const stageScore = template === "gameshow" && active && !result && !assignment && localContent
    ? grade(template, localContent, items.map((_, i) => answers[i] ?? [])).score : null;

  useEffect(() => {
    function updateFullscreen() { setFullscreen(document.fullscreenElement === panelRef.current); }
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  useEffect(() => {
    if (!classroomFallback) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") setClassroomFallback(false); }
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [classroomFallback]);

  useEffect(() => () => { void audioContext.current?.close().catch(() => {}); }, []);

  useEffect(() => {
    if (active || replayPending.current) focusTarget.current?.focus();
    replayPending.current = false;
  }, [active, turn, result]);

  useEffect(() => {
    if (!active || !draftKey || !draftId.current) return;
    // shortcut: drafts survive a reload in this tab, cross-device drafts require server storage.
    try {
      if (result) sessionStorage.removeItem(draftKey);
      else sessionStorage.setItem(draftKey, JSON.stringify({ id: draftId.current, order, turn, answers }));
    } catch { /* The browser may disable session storage. */ }
  }, [active, draftKey, result, order, turn, answers]);

  async function toggleClassroom() {
    if (classroomFallback) { setClassroomFallback(false); return; }
    if (fullscreen) { await document.exitFullscreen().catch(() => {}); return; }
    if (panelRef.current?.requestFullscreen) {
      try { await panelRef.current.requestFullscreen(); return; } catch { /* Use the viewport where native fullscreen is unavailable. */ }
    }
    setClassroomFallback(true);
  }

  async function toggleSound() {
    if (sound) { setSound(false); return; }
    if (!window.AudioContext) return;
    try {
      audioContext.current ??= new AudioContext();
      await audioContext.current.resume();
      setSound(true);
    } catch { setError("Thiết bị chưa bật được âm thanh."); }
  }

  function chime(correct: boolean) {
    const audio = audioContext.current;
    if (!sound || !audio || audio.state !== "running") return;
    const now = audio.currentTime;
    const tone = audio.createOscillator();
    const volume = audio.createGain();
    tone.frequency.setValueAtTime(correct ? 520 : 290, now);
    tone.frequency.exponentialRampToValueAtTime(correct ? 740 : 210, now + 0.16);
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(0.12, now + 0.025);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.21);
    tone.connect(volume).connect(audio.destination);
    tone.onended = () => { tone.disconnect(); volume.disconnect(); };
    tone.start(now);
    tone.stop(now + 0.22);
  }

  async function start() {
    setBusy(true);
    setError("");
    try {
      const started = assignment ? await startAttempt(assignment, nickname) : { items: initialItems, reveals: initialReveals, assets: initialAssets };
      if ("error" in started && started.error) { setError(started.error); return; }
      if (!started.items?.length) { setError("Hoạt động chưa có nội dung."); return; }
      const indexes = started.items.map((_, i) => i);
      draftId.current = "draftId" in started ? started.draftId ?? null : null;
      let draft: { id: string; order: number[]; turn: number; answers: Record<number, string[]> } | null = null;
      if (draftKey && draftId.current) {
        try {
          const saved = JSON.parse(sessionStorage.getItem(draftKey) ?? "null");
          if (saved?.id === draftId.current && Array.isArray(saved.order) && saved.order.length === indexes.length &&
            indexes.every(i => saved.order.includes(i)) && indexes.includes(saved.turn) && saved.answers &&
            Object.entries(saved.answers).every(([i, values]) => indexes.includes(Number(i)) &&
              Array.isArray(values) && values.every(value => typeof value === "string"))) draft = saved;
        } catch { /* Ignore a draft that cannot be read. */ }
      }
      setItems(started.items);
      setReveals(started.reveals ?? []);
      setAssets(started.assets ?? {});
      setOrder(draft?.order ?? (template === "wheel" ? shuffle(indexes) : indexes));
      setTurn(draft?.turn ?? 0);
      setSelected([]);
      setAnswers(draft?.answers ?? {});
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
      const local = assignment ? null : grade(template, localContent ?? [], ordered);
      const response = local ?? await finishAttempt(assignment!, ordered);
      if ("error" in response && response.error) { setError(response.error); return; }
      if ("score" in response) {
        const review = local && localContent ? missedReview(localContent, ordered.map((answer, i) => ({ answer, correct: local.correct[i] })))
          : "review" in response ? response.review : undefined;
        setResult({ score: response.score, total: response.total, review });
        if (response.score !== null && (assignment || rows)) chime(response.score === response.total);
      }
    } catch { setError("Mất kết nối. Bạn có thể thử nộp lại."); }
    finally { setBusy(false); }
  }

  function next(answer: string[]) {
    const updated = { ...answers, [index]: answer };
    if (!assignment && localContent) {
      const { correct } = grade(template, [localContent[index]], [answer]);
      if (correct[0] !== null) {
        chime(correct[0]);
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

  return <section ref={panelRef} className={`player game-stage game-${template} ${template === "gameshow" ? "gameshow" : ""} ${classroomFallback ? "classroom-fallback" : ""}`}>
    <div className="player-top"><span className={`template-tag ${meta.color}`}>{meta.icon} &nbsp;{meta.title}</span>
      <div className="game-tools">
        <button type="button" className="icon-button" aria-label="Âm thanh phản hồi" aria-pressed={sound} onClick={() => void toggleSound()}>
          {sound ? <Volume2 size={19}/> : <VolumeX size={19}/>}
        </button>
        <button type="button" className="icon-button" aria-label={fullscreen || classroomFallback ? "Thoát toàn màn hình" : "Toàn màn hình"}
          aria-pressed={fullscreen || classroomFallback} onClick={() => void toggleClassroom()}>
          {fullscreen || classroomFallback ? <Minimize size={19}/> : <Maximize size={19}/>}
        </button>
      </div>
    </div>
    <h1>{title}</h1>
    {stageScore !== null && <div className="game-scoreboard"><span>Điểm sân khấu</span><strong key={stageScore} aria-live="polite">{stageScore}</strong></div>}
    {error && <p role="alert" className="notice error">{error}</p>}
    <p role="status" aria-atomic="true" className={feedback ? "notice" : "sr-only"}>
      {feedback}
    </p>
    {result ? <div className="result"><h2 tabIndex={-1} ref={bindFocus}
      aria-describedby={result.score !== null || assignment ? outcomeId : undefined}>Hoàn thành!</h2>
      {result.score !== null && <strong id={outcomeId}>{result.score}/{result.total} điểm</strong>}
      {assignment && <p id={result.score === null ? outcomeId : undefined}>Bài làm đã được lưu.</p>}
      {!!result.review?.length && <details className="review-panel"><summary>Xem lại câu sai ({result.review.length})</summary>
        <ol>{result.review.map((entry, index) => <li key={index}>
          <strong>{entry.prompt}</strong>
          <p>Em chọn {entry.selected.join(" / ") || "—"}</p><p>Đáp án {entry.expected.join(" / ")}</p>
          {entry.explanation && <p>{entry.explanation}</p>}
        </li>)}</ol></details>}
      <button className="button primary" onClick={() => {
        replayPending.current = true;
        setResult(null);
        setActive(false);
        setFeedback("");
      }}><RotateCcw size={16}/> Chơi lại</button>
    </div> : !active ? <div className="game-intro">
      <div className="game-art" aria-hidden="true" style={{ backgroundPosition: theme.artPosition }}/>
      <form onSubmit={event => { event.preventDefault(); void start(); }}>
      <p>{theme.instruction}</p>
      {assignment && requireName && <label>Biệt danh<input value={nickname} onChange={event => setNickname(event.target.value)} maxLength={80} required /></label>}
      {assignment && <p className="hint">Nếu đã bắt đầu, em có thể tiếp tục sau khi tải lại trong cùng thẻ trình duyệt.</p>}
      <button ref={bindFocus} className="button primary" disabled={!ready || busy}>{busy ? "Đang mở…" : "Bắt đầu"}</button>
    </form></div> : rows ? <div className="play-stack" tabIndex={-1} ref={bindFocus}>
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
      <div className="progress-label"><span id={progressId}>Mục {turn + 1} / {items.length}</span><progress aria-labelledby={progressId} value={turn + 1} max={items.length}/></div>
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
    </div>}
  </section>;
}
