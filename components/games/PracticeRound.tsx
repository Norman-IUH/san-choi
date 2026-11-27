"use client";
import { useContext, useRef, useState } from "react";
import { colourPalette, practiceModes, samplePracticeAudio } from "@/lib/games/practice";
import { normalize } from "@/lib/game";
import { LessonMedia, RefreshLessonMedia } from "./LessonMedia";
import type { RoundProps } from "./LegacyRound";

function storedPlays(key?: string) {
  if (!key) return 0;
  try { return Number(sessionStorage.getItem(key)) || 0; } catch { return 0; }
}

export default function PracticeRound({ items, index, turn, assets, busy, bindFocus, next, practiceSession }: RoundProps) {
  const item = items[index];
  const practice = item.practice!;
  const path = item.media?.audio;
  const source = path && assets[path];
  const image = item.media?.image && assets[item.media.image];
  // shortcut: the practice limit survives reloads in this tab; enforce delivery on the server if a stricter policy is needed.
  const key = practiceSession && path ? `san-choi-listens:${practiceSession}:${path}` : undefined;
  const [plays, setPlays] = useState(() => storedPlays(key));
  const [speed, setSpeed] = useState(1);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const pendingPlay = useRef(false);
  const refresh = useContext(RefreshLessonMedia);
  const limited = practice.maxPlays > 0 && plays >= practice.maxPlays;
  const colour = practice.mode === "colour" ? colourPalette[normalize(answer)] : undefined;
  function recover() {
    setPlaying(false);
    setError(true);
    if (source) refresh?.(source);
  }
  async function play() {
    const element = audio.current;
    if (!element || limited || pendingPlay.current) return;
    pendingPlay.current = true;
    setError(false);
    try {
      element.currentTime = 0;
      element.playbackRate = speed;
      await element.play();
      const used = plays + 1;
      setPlays(used);
      setPlaying(true);
      if (key) try { sessionStorage.setItem(key, String(used)); } catch { /* Session storage can be disabled. */ }
    } catch { recover(); }
    finally { pendingPlay.current = false; }
  }

  return <div className="play-stack practice-round">
    <span className="muted" lang="en">{practiceModes[practice.mode]}</span>
    <h2 className="lesson-text" ref={bindFocus} tabIndex={-1}>{item.prompt}</h2>
    {practice.stimulus && <p className="lesson-text">{practice.stimulus}</p>}
    {image && <div className="practice-picture">
      <LessonMedia media={{ image: item.media?.image }} assets={assets} label="Hình bài luyện"/>
      {colour && <span aria-hidden="true" style={{ backgroundColor: colour, maskImage: `url("${image}")` }}/>}
    </div>}
    <div className="inline-actions">
      {source && <audio ref={audio} src={source} preload="none" onError={recover}
        onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)}/>}
      <button className="button" type="button" disabled={!source || (limited && !playing)} onClick={() => playing ? audio.current?.pause() : void play()}>
        {playing ? "Dừng audio" : plays ? "Nghe lại" : "Nghe"}
      </button>
      <label>Tốc độ<select value={speed} onChange={event => {
        const rate = Number(event.target.value);
        setSpeed(rate);
        if (audio.current) audio.current.playbackRate = rate;
      }}><option value={1}>Bình thường</option><option value={.75}>Chậm</option></select></label>
      {path && samplePracticeAudio.safeParse(path).success && <small>Audio tổng hợp</small>}
      {practice.maxPlays > 0 && <p role="status">Còn {Math.max(0, practice.maxPlays - plays)} lượt nghe</p>}
    </div>
    {(!source || error) && <p role="alert">Chưa phát được audio. Hãy thử lại hoặc báo giáo viên.</p>}
    {practice.transcript && <details><summary>Đọc transcript</summary><p lang="en">{practice.transcript}</p></details>}
    <form className="stack" onSubmit={event => { event.preventDefault(); if (!busy) next(answer.trim() ? [answer] : []); }}>
      {practice.mode === "dictation" ?
        <label>Câu trả lời<input lang="en" value={answer} onChange={event => setAnswer(event.target.value)}
          autoComplete="off" spellCheck={false} maxLength={400}/></label> :
        <div className="options" role="group" aria-label="Phương án bài luyện">{item.options.map(option =>
          <button className="option" key={option} type="button" aria-pressed={answer === option} onClick={() => setAnswer(option)}>
            {practice.mode === "colour" && <span className="practice-swatch" aria-hidden="true" style={{ backgroundColor: colourPalette[normalize(option)] }}/>}
            {option}
          </button>)}</div>}
      <div className="inline-actions">
        {answer.trim() ? <button className="button primary" disabled={busy}>{turn + 1 === items.length ? "Hoàn thành" : "Tiếp theo"}</button> :
          <button className="button" disabled={busy}>{turn + 1 === items.length ? "Nộp và để trống" : "Bỏ qua câu này"}</button>}
      </div>
    </form>
  </div>;
}
