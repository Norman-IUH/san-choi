"use client";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, Maximize, Minimize, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { finishAttempt, guessAssignmentLetter, refreshLessonMedia, startAttempt } from "@/app/play/actions";
import { grade, missedReview, shuffle, templates, type Template, type Item, type PlayItem, type ReviewEntry } from "@/lib/game";
import { LessonMedia, RefreshLessonMedia } from "./games/LessonMedia";
import { isReading } from "@/lib/games/practice";
import { GameRound } from "./games/GameRound";
import { Progress } from "./games/Progress";
import { hangmanPattern } from "@/lib/games/word-puzzles";
import { isWordTemplate } from "@/lib/games/word-templates";
import { isPuzzleTemplate } from "@/lib/games/puzzle-templates";
import { isArcadeTemplate } from "@/lib/games/arcade-templates";
import { gameTheme } from "./games/game-themes";

type Props = { title: string; description?: string; backHref?: string; template: Template; initialItems?: PlayItem[]; reveals?: string[];
  localContent?: Item[]; assignment?: string; requireName?: boolean; assets?: Record<string, string>;
  mediaScope?: { source: "activity" | "resource"; id: string }; voiceEnabled?: boolean };

const subscribeToNothing = () => () => {};

export function Player({ title, description, backHref, template, initialItems = [], reveals: initialReveals = [], localContent, assignment, requireName, assets: initialAssets = {}, mediaScope, voiceEnabled }: Props) {
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
  const [result, setResult] = useState<{ score: number | null; total: number; review?: ReviewEntry[]; pendingReview?: boolean } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [sound, setSound] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [classroomFallback, setClassroomFallback] = useState(false);
  const [practiceSession, setPracticeSession] = useState<string>();
  const [hudTools, setHudTools] = useState<HTMLDivElement | null>(null);
  const draftId = useRef<string | null>(null);
  const lastMediaRefresh = useRef(0);
  const audioContext = useRef<AudioContext | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const pauseDialog = useRef<HTMLDialogElement | null>(null);
  const focusTarget = useRef<HTMLElement | null>(null);
  const pendingFocus = useRef(false);
  const replayPending = useRef(false);
  const outcomeId = useId();
  const draftKey = assignment ? `san-choi-draft:${assignment}` : null;
  const bindFocus = useCallback((node: HTMLElement | null) => {
    focusTarget.current = node;
    if (node && pendingFocus.current) {
      pendingFocus.current = false;
      node.focus();
    }
  }, []);
  const soundSupported = ready && typeof window.AudioContext === "function";
  const meta = templates[template];
  const theme = gameTheme(template);
  const arcade = isArcadeTemplate(template);
  const gameplayThumbnail = arcade || isWordTemplate(template) || isPuzzleTemplate(template);
  const artStyle = gameplayThumbnail ? { backgroundImage: `url(/illustrations/${arcade ? "arcade" : "gameplay"}/${template}.webp)` } : { backgroundPosition: theme.artPosition };
  const defaultArcadePractice = arcade && !assignment && !!localContent && localContent.every(item => !item.arcade?.timed);
  const index = order[turn] ?? 0;
  const practice = items[0]?.practice;
  const reading = practice && isReading(practice.mode) ? practice : undefined;
  const rows = template === "match-up" || template === "group-sort";
  const board = rows || template === "open-box" || template === "flip-tiles" || template === "matching-pairs";
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
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape" && !pauseDialog.current?.open) setClassroomFallback(false); }
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [classroomFallback]);

  useEffect(() => () => { void audioContext.current?.close().catch(() => {}); }, []);

  useEffect(() => {
    if (active || replayPending.current) {
      pendingFocus.current = !focusTarget.current;
      focusTarget.current?.focus();
    }
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

  function chime(correct: boolean | null) {
    const audio = audioContext.current;
    if (!sound || !audio || audio.state !== "running") return;
    const now = audio.currentTime;
    const tone = audio.createOscillator();
    const volume = audio.createGain();
    tone.frequency.setValueAtTime(correct === null ? 420 : correct ? 520 : 290, now);
    tone.frequency.exponentialRampToValueAtTime(correct === null ? 170 : correct ? 740 : 210, now + 0.16);
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
      setPracticeSession(draftId.current ?? (started.items.some(item => item.practice) ? crypto.randomUUID() : undefined));
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
        setResult({ score: response.score, total: response.total, review, pendingReview: "pendingReview" in response && response.pendingReview });
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

  const round = <GameRound key={turn} {...{ template, items, order, turn, index, answers, setAnswers, assets, reveals, busy, bindFocus, next, submit, hudTools, practiceSession }}
    voiceUrl={voiceEnabled && assignment ? `/play/${assignment}/voice/${index}` : undefined}
    playHit={arcade ? () => chime(null) : undefined}
    guess={template === "hangman" ? async (letter, guesses) => assignment ? guessAssignmentLetter(assignment, index, letter)
      : localContent?.[index] ? { ...hangmanPattern(localContent[index].answers[0], guesses), guesses } : null : undefined}/>;

  return <RefreshLessonMedia.Provider value={renewMedia}><section ref={panelRef} className={`player game-stage game-${template} ${arcade ? "arcade-stage" : ""} ${template === "gameshow" ? "gameshow" : ""} ${classroomFallback ? "classroom-fallback" : ""}`}>
    <div className="player-top"><div className="game-identity">
      {backHref && <Link className="icon-button game-back" aria-label={backHref === "/#mau" ? "Tất cả mẫu" : "Quay lại học liệu"} href={backHref}><ArrowLeft size={20}/></Link>}
      <span className={`template-tag ${meta.color}`}>{meta.title}</span>
    </div>
      {active && !result && template !== "crossword" && <Progress value={board ? Object.keys(answers).length : turn + 1} total={items.length}/>}
      {stageScore !== null && <div className="game-scoreboard"><span>{arcade ? "Điểm luyện tập" : "Điểm sân khấu"}</span><strong key={stageScore} aria-live="polite">{stageScore}</strong></div>}
      <div className="game-tools">
        <div ref={setHudTools} className="game-round-tools"/>
        {active && !result && !arcade && <button type="button" className="icon-button" aria-label="Tạm dừng" onClick={() => {
          panelRef.current?.querySelectorAll("audio").forEach(audio => audio.pause());
          pauseDialog.current?.showModal();
        }}><Pause size={19} aria-hidden="true"/></button>}
        <button type="button" className="icon-button" aria-label="Âm thanh phản hồi" aria-pressed={sound} disabled={!soundSupported}
          title={ready && !soundSupported ? "Trình duyệt không hỗ trợ âm thanh phản hồi" : undefined} onClick={() => void toggleSound()}>
          {sound ? <Volume2 size={19}/> : <VolumeX size={19}/>}
        </button>
        <button type="button" className="icon-button" aria-label={fullscreen || classroomFallback ? "Thoát toàn màn hình" : "Toàn màn hình"}
          aria-pressed={fullscreen || classroomFallback} onClick={() => void toggleClassroom()}>
          {fullscreen || classroomFallback ? <Minimize size={19}/> : <Maximize size={19}/>}
        </button>
      </div>
    </div>
    {active && <h1 className={result ? "sr-only" : "game-round-title"}>{title}</h1>}
    {error && <p role="alert" className="notice error">{error}</p>}
    <p role="status" aria-atomic="true" className={feedback ? "notice" : "sr-only"}>
      {feedback}
    </p>
    {result ? <div className="result game-completion">
      <div className={`game-art completion-art${gameplayThumbnail ? " gameplay-thumbnail" : ""}`} aria-hidden="true" style={artStyle}/>
      <h2 tabIndex={-1} ref={bindFocus}
      aria-describedby={result.score !== null || assignment ? outcomeId : undefined}>Hoàn thành!</h2>
      {result.score !== null && <strong id={outcomeId}>{result.score}/{result.total} điểm</strong>}
      {assignment && <p id={result.score === null ? outcomeId : undefined}>Bài làm đã được lưu.</p>}
      {assignment && result.pendingReview && <Link className="button" href={`/play/${assignment}/review`}>Xem nhận xét khi giáo viên công bố</Link>}
      <p>{result.score !== null && result.score === result.total ? "Em đã hoàn thành xuất sắc!" : "Giỏi lắm, em đã hoàn thành lượt chơi."}</p>
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
        style={artStyle}/>
      <form onSubmit={event => { event.preventDefault(); void start(); }}>
      <h1>{title}</h1>
      <p>{theme.instruction}</p>
      {description && <p className="hint">{description}</p>}
      {defaultArcadePractice && <p className="hint">Luyện tập không giới hạn thời gian</p>}
      {assignment && requireName && <label>Biệt danh<input value={nickname} onChange={event => setNickname(event.target.value)} maxLength={80} required /></label>}
      {assignment && <p className="hint">Nếu đã bắt đầu, em có thể tiếp tục sau khi tải lại trong cùng thẻ trình duyệt.</p>}
      <button ref={bindFocus} className="button primary game-start" disabled={!ready || busy}><Play size={20} aria-hidden="true"/>{busy ? "Đang mở…" : "Bắt đầu"}</button>
    </form></div> : reading ? <div className="reading-layout">
      <details className="reading-source" open><summary>Ngữ liệu đọc</summary>
        <LessonMedia media={{ image: reading.stimulusImage }} assets={assets} label="Hình ngữ liệu đọc"/>
        {reading.stimulus && <p lang="en">{reading.stimulus}</p>}
      </details>
      {round}
    </div> : <>
      {items[index]?.practice?.mode === "grammar" && items[index].practice?.stimulus &&
        <p className="grammar-example">Ví dụ <span lang="en">{items[index].practice.stimulus}</span></p>}
      {round}
    </>}
    {active && !result && !arcade && <dialog ref={pauseDialog} className="game-pause-dialog" aria-label="Tạm dừng trò chơi">
      <h2>Đang tạm dừng</h2>
      <form method="dialog"><button className="button primary">Tiếp tục chơi</button></form>
    </dialog>}
  </section></RefreshLessonMedia.Provider>;
}
