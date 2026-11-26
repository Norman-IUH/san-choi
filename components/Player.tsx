"use client";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Maximize, Minimize, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { finishAttempt, guessAssignmentLetter, refreshLessonMedia, startAttempt } from "@/app/play/actions";
import { grade, missedReview, shuffle, templates, type Template, type Item, type PlayItem, type ReviewEntry } from "@/lib/game";
import { RefreshLessonMedia } from "./games/LessonMedia";
import { GameRound } from "./games/GameRound";
import { hangmanPattern } from "@/lib/games/word-puzzles";
import { isWordTemplate } from "@/lib/games/word-templates";
import { isPuzzleTemplate } from "@/lib/games/puzzle-templates";
import { isArcadeTemplate } from "@/lib/games/arcade-templates";
import { gameTheme } from "./games/game-themes";

type Props = { title: string; template: Template; initialItems?: PlayItem[]; reveals?: string[];
  localContent?: Item[]; assignment?: string; requireName?: boolean; assets?: Record<string, string>;
  mediaScope?: { source: "activity" | "resource"; id: string } };

const subscribeToNothing = () => () => {};

export function Player({ title, template, initialItems = [], reveals: initialReveals = [], localContent, assignment, requireName, assets: initialAssets = {}, mediaScope }: Props) {
  const ready = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const [items, setItems] = useState(initialItems);
  const [reveals, setReveals] = useState(initialReveals);
  const [assets, setAssets] = useState(initialAssets);
  const [active, setActive] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [turn, setTurn] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ score: number | null; total: number; review?: ReviewEntry[] } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [sound, setSound] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [classroomFallback, setClassroomFallback] = useState(false);
  const draftId = useRef<string | null>(null);
  const lastMediaRefresh = useRef(0);
  const audioContext = useRef<AudioContext | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const focusTarget = useRef<HTMLElement | null>(null);
  const replayPending = useRef(false);
  const outcomeId = useId();
  const draftKey = assignment ? `san-choi-draft:${assignment}` : null;
  const bindFocus = (node: HTMLElement | null) => { focusTarget.current = node; };
  const meta = templates[template];
  const theme = gameTheme(template);
  const arcade = isArcadeTemplate(template);
  const gameplayThumbnail = arcade || isWordTemplate(template) || isPuzzleTemplate(template);
  const index = order[turn] ?? 0;
  const rows = template === "match-up" || template === "group-sort";
  const stageScore = (arcade || template === "gameshow") && active && !result && !assignment && localContent
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
      setAnswers(draft?.answers ?? {});
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
      const { correct } = grade(template, [localContent[index]], [answer], index);
      if (correct[0] !== null) {
        chime(correct[0]);
        const explanation = localContent[index].explanation;
        setFeedback(`Mục ${turn + 1}: ${correct[0] ? "Chính xác!" : "Chưa chính xác."}${explanation ? " " + explanation : ""}`);
      }
    }
    if (turn + 1 === items.length) { void submit(updated); return; }
    setAnswers(updated);
    setTurn(turn + 1);
  }

  async function renewMedia(failedUrl: string) {
    if (!failedUrl.startsWith("https://") || Date.now() - lastMediaRefresh.current < 60000) return;
    const scope = assignment ? { source: "assignment" as const, id: assignment } : mediaScope;
    const path = Object.keys(assets).find(key => assets[key] === failedUrl);
    if (!scope || !path) return;
    lastMediaRefresh.current = Date.now();
    try {
      const fresh = await refreshLessonMedia(scope.source, scope.id);
      if (fresh?.[path] && fresh[path] !== failedUrl) { setAssets(previous => ({ ...previous, ...fresh })); return; }
    } catch { /* Keep the lesson usable while media is unavailable. */ }
    setError("Tệp học liệu chưa tải được. Em vẫn có thể tiếp tục làm bài.");
  }

  return <RefreshLessonMedia.Provider value={renewMedia}><section ref={panelRef} className={`player game-stage game-${template} ${arcade ? "arcade-stage" : ""} ${template === "gameshow" ? "gameshow" : ""} ${classroomFallback ? "classroom-fallback" : ""}`}>
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
    {stageScore !== null && <div className="game-scoreboard"><span>{arcade ? "Điểm luyện tập" : "Điểm sân khấu"}</span><strong key={stageScore} aria-live="polite">{stageScore}</strong></div>}
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
      <div className={gameplayThumbnail ? "game-art gameplay-thumbnail" : "game-art"} aria-hidden="true"
        style={gameplayThumbnail ? { backgroundImage: `url(/illustrations/${arcade ? "arcade" : "gameplay"}/${template}.webp)` } : { backgroundPosition: theme.artPosition }}/>
      <form onSubmit={event => { event.preventDefault(); void start(); }}>
      <p>{theme.instruction}</p>
      {assignment && requireName && <label>Biệt danh<input value={nickname} onChange={event => setNickname(event.target.value)} maxLength={80} required /></label>}
      {assignment && <p className="hint">Nếu đã bắt đầu, em có thể tiếp tục sau khi tải lại trong cùng thẻ trình duyệt.</p>}
      <button ref={bindFocus} className="button primary" disabled={!ready || busy}>{busy ? "Đang mở…" : "Bắt đầu"}</button>
    </form></div> : <GameRound key={turn} {...{ template, items, order, turn, index, answers, setAnswers, assets, reveals, busy, bindFocus, next, submit }}
      guess={template === "hangman" ? async (letter, guesses) => assignment ? guessAssignmentLetter(assignment, index, letter)
        : localContent?.[index] ? { ...hangmanPattern(localContent[index].answers[0], guesses), guesses } : null : undefined}/>}
  </section></RefreshLessonMedia.Provider>;
}
