"use client";
import { useEffect, useState } from "react";
import { isSpeaking } from "@/lib/games/productive";
import { practiceModes } from "@/lib/games/practice";
import { LessonMedia } from "./LessonMedia";
import type { RoundProps } from "./LegacyRound";
import { VoiceRecorder } from "./VoiceRecorder";

export default function ProductiveRound({ items, index, turn, assets, answers, setAnswers, next, busy, bindFocus, voiceUrl }: RoundProps) {
  const item = items[index];
  const practice = item.practice!;
  const config = practice.production!;
  const speaking = isSpeaking(practice.mode);
  const value = answers[index]?.[0] ?? "";
  const [timer, setTimer] = useState<{ end: number; label: string }>();
  const [seconds, setSeconds] = useState(0);
  const [voiceBusy, setVoiceBusy] = useState(false);
  useEffect(() => {
    if (!timer) return;
    const handle = setInterval(() => setSeconds(Math.max(0, Math.ceil((timer.end - Date.now()) / 1000))), 250);
    const end = setTimeout(() => clearInterval(handle), Math.max(0, timer.end - Date.now() + 300));
    return () => { clearInterval(handle); clearTimeout(end); };
  }, [timer]);

  function time(duration: number, label: string) {
    setSeconds(duration);
    setTimer({ end: Date.now() + duration * 1000, label });
  }

  return <div className="play-stack productive-round">
    <div lang="en" className="productive-brief">
      <p className="muted">{practiceModes[practice.mode]}</p>
      <h2 className="lesson-text" ref={bindFocus} tabIndex={-1}>{item.prompt}</h2>
      {practice.stimulus && <p>{practice.stimulus}</p>}
      <div className="productive-pictures">
        <LessonMedia media={{ image: item.media?.image }} assets={assets} label="Hình ngữ liệu 1"/>
        <LessonMedia media={{ image: practice.stimulusImage }} assets={assets} label="Hình ngữ liệu 2"/>
      </div>
      {item.media?.audio && <LessonMedia media={{ audio: item.media.audio }} assets={assets} label="Nghe hướng dẫn"/>}
      {config.hints && <details><summary>Useful words</summary><p>{config.hints}</p></details>}
      {config.example && <details><summary>Example</summary><p>{config.example}</p></details>}
    </div>
    {speaking && <div className="inline-actions">
      {config.preparation > 0 && <button type="button" className="button" onClick={() => time(config.preparation, "Chuẩn bị")}>Bắt đầu chuẩn bị</button>}
      {config.duration > 0 && <button type="button" className="button" onClick={() => time(config.duration, "Trả lời")}>Bắt đầu trả lời</button>}
      {timer && <><span role="timer">{timer.label} · {seconds} giây</span><button type="button" className="button" onClick={() => setTimer(undefined)}>Dừng đồng hồ</button></>}
      {timer && seconds === 0 && <span role="status">Đã hết thời gian.</span>}
    </div>}
    {speaking && voiceUrl && <VoiceRecorder endpoint={voiceUrl} secondsLimit={config.duration || 90} onBusy={setVoiceBusy}/>}
    <form className="stack" onSubmit={event => { event.preventDefault(); if (!busy && !voiceBusy) next(value.trim() ? [value] : []); }}>
      <label>{speaking ? "Ghi chú phần nói (tùy chọn)" : "Câu trả lời"}
        <textarea lang="en" rows={config.objective ? 2 : 5} value={value} maxLength={config.limit} spellCheck={false}
          onChange={event => setAnswers(previous => ({ ...previous, [index]: [event.target.value] }))}/></label>
      <span className="muted">{value.length}/{config.limit} ký tự</span>
      <div className="inline-actions"><button className="button primary" disabled={busy || voiceBusy}>
        {turn + 1 === items.length ? "Hoàn thành" : "Tiếp theo"}
      </button>{!value.trim() && !speaking && <span className="muted">Có thể nộp câu trống.</span>}</div>
    </form>
  </div>;
}
