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

export default function PracticeRound(props: RoundProps) {
  const [clip, setClip] = useState(0);
  const { items, answers, setAnswers, submit, busy } = props;
  if (items.length < 2 || !items.every(item => item.practice?.mode === "listen-match")) return <PracticeQuestion {...props}/>;
  const choices = items[0].options.filter(option => items.every(item => item.options.includes(option)));
  return <section className="play-stack">
    <p>Chọn một clip, nghe rồi ghép với thẻ. Mỗi thẻ chỉ dùng một lần.</p>
    <div className="inline-actions" role="group" aria-label="Clip cần ghép">{items.map((_, row) =>
      <button type="button" className="button" key={row} aria-pressed={clip === row} onClick={() => setClip(row)}>
        Clip {row + 1}{answers[row]?.[0] ? ` · ${answers[row][0]}` : ""}
      </button>)}</div>
    <PracticeQuestion key={clip} {...props} index={clip} choices={choices} paired={answers[clip]?.[0]}
      taken={choices.filter(option => items.some((_, row) => row !== clip && answers[row]?.[0] === option))}
      next={answer => setAnswers({ ...answers, [clip]: answer })}/>
    <button type="button" className="button primary" disabled={busy || items.some((_, row) => !answers[row]?.length)}
      onClick={() => submit(answers)}>Hoàn thành</button>
  </section>;
}

function PracticeQuestion({ items, index, turn, assets, busy, bindFocus, next, practiceSession, choices, paired, taken }:
  RoundProps & { choices?: string[]; paired?: string; taken?: string[] }) {
  const item = items[index];
  const practice = item.practice!;
  const path = item.media?.audio;
  const source = path && assets[path];
  const image = item.media?.image && assets[item.media.image];
  // shortcut: the practice limit survives reloads in this tab; enforce delivery on the server if a stricter policy is needed.
  const key = practiceSession && path ? `san-choi-listens:${practiceSession}:${path}` : undefined;
  const [plays, setPlays] = useState(() => storedPlays(key));
  const [speed, setSpeed] = useState(1);
  const [answer, setAnswer] = useState(paired ?? "");
  const [region, setRegion] = useState<number>();
  const [paints, setPaints] = useState<Record<number, string>>({});
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
      {!practice.regions && colour && <span className="practice-overlay" aria-hidden="true" style={{ backgroundColor: colour, maskImage: `url("${image}")` }}/>}
      {practice.regions?.map(({ x, y, width, height }, index) => <button type="button" key={index} className="practice-region"
        aria-pressed={region === index + 1} onClick={() => { setRegion(index + 1); setAnswer(""); }}
        style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%`, backgroundColor: paints[index + 1] }}>
        <span>{`Vùng ${index + 1}`}</span></button>)}
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
    <form className="stack" onSubmit={event => {
      event.preventDefault();
      if (!busy) next(!answer.trim() ? [] : region ? [answer, `Vùng ${region}`] : [answer]);
    }}>
      {practice.mode === "dictation" ?
        <label>Câu trả lời<input lang="en" value={answer} onChange={event => setAnswer(event.target.value)}
          autoComplete="off" spellCheck={false} maxLength={400}/></label> :
        <div className="options" role="group" aria-label="Phương án bài luyện">{(choices ?? item.options).map((option, position) =>
          <button className="option" key={option} type="button" aria-label={practice.pictureChoices ? `Hình ${position + 1}` : undefined}
            aria-pressed={answer === option} disabled={taken?.includes(option) || Boolean(practice.regions && !region)} onClick={() => {
            setAnswer(option);
            if (choices) next([option]);
            if (region) setPaints({ ...paints, [region]: colourPalette[normalize(option)] });
          }}>
            <LessonMedia media={item.optionMedia?.find(entry => entry.option === option)} assets={assets} label={`Hình ${position + 1}`}/>
            {practice.mode === "colour" && <span className="practice-swatch" aria-hidden="true" style={{ backgroundColor: colourPalette[normalize(option)] }}/>}
            {practice.pictureChoices ? <span>Hình {position + 1}</span> : option}
          </button>)}</div>}
      {!choices && <div className="inline-actions">
        {answer.trim() ? <button className="button primary" disabled={busy}>{turn + 1 === items.length ? "Hoàn thành" : "Tiếp theo"}</button> :
          <button className="button" disabled={busy}>{turn + 1 === items.length ? "Nộp và để trống" : "Bỏ qua câu này"}</button>}
      </div>}
    </form>
  </div>;
}
