"use client";

import {createClient} from "@supabase/supabase-js";
import {useEffect,useState,useTransition} from "react";
import {answerLive,controlLive,joinLive,readyLive,refreshGuest,refreshHost} from "@/app/live/actions";
import type {LiveCommand,LiveState} from "@/lib/live";
import {LiveRanking} from "./LiveRanking";

export function LiveStage({host,code,initial}:{host?:string;code?:string;initial:LiveState|null}) {
  const [state,setState]=useState(initial);
  const [error,setError]=useState("");
  const [connection,setConnection]=useState("Đang kết nối");
  const [pending,run]=useTransition();
  const topic=state?.topic;
  useEffect(()=>{
    if (!topic || (!host && !code)) return;
    let disposed=false;
    let running=false;
    let timer:ReturnType<typeof setTimeout>|undefined;
    const refresh=()=>{
      if (disposed || running || timer) return;
      timer=setTimeout(async ()=>{
        timer=undefined;
        if (disposed) return;
        running=true;
        try {
          const incoming=host ? await refreshHost(host) : await refreshGuest(code!);
          if (!disposed) setState(incoming);
        } catch { if (!disposed) setConnection("Đang thử kết nối lại"); }
        finally { running=false; }
      },250);
    };
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const db=url && key ? createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}) : null;
    const channel=db?.channel(topic).on("broadcast",{event:"refresh"},refresh).subscribe(status=>{
      if (disposed) return;
      setConnection(status==="SUBSCRIBED" ? "Đã kết nối trực tiếp" : "Đang đồng bộ định kỳ");
      if (status==="SUBSCRIBED") refresh();
    });
    const interval=setInterval(refresh,code ? 12000 : 6500);
    window.addEventListener("online",refresh);
    return ()=>{
      disposed=true;
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("online",refresh);
      if (channel) void db?.removeChannel(channel);
    };
  },[topic,host,code]);
  function execute(action:()=>Promise<{error?:string;state?:LiveState|null}>) {
    setError("");
    run(async()=>{
      try {
        const response=await action();
        if (response.error) setError(response.error);
        if (response.state!==undefined) setState(response.state);
      } catch { setError("Chưa kết nối được. Hãy thử lại."); }
    });
  }
  if (!state) return <form className="panel stack" onSubmit={event=>{
    event.preventDefault();
    const value=String(new FormData(event.currentTarget).get("personal") ?? "");
    if (code) execute(()=>joinLive(code,value));
  }}>
    <h1>Tham gia lớp trực tiếp</h1>
    <label>Mã cá nhân nếu phòng thuộc một lớp<input type="password" name="personal" autoComplete="off" maxLength={24}/></label>
    {error && <p role="alert">{error}</p>}
    <button className="button primary" disabled={pending}>Tham gia</button>
  </form>;
  const command=(name:LiveCommand)=>{if(host) execute(()=>controlLive(host,name,state.index));};
  const stats=state.stats;
  return <section className="panel stack live-stage">
    <div className="section-head"><h1>{state.title}</h1><small>{connection}</small></div>
    <p role="status">{{lobby:"Đang chờ bắt đầu",playing:"Đang chơi",paused:"Tạm dừng",ended:"Phòng đã kết thúc"}[state.phase]}</p>
    {!!state.team && <p>Em thuộc {state.team===1 ? "Đội Xanh" : "Đội Cam"}.</p>}
    {error && <p className="notice error" role="alert">{error}</p>}
    {stats && <div className="stats">
      <div><strong>{stats.players}</strong><p>Đã tham gia</p></div><div><strong>{stats.ready}</strong><p>Sẵn sàng</p></div>
      <div><strong>{stats.responses}</strong><p>Câu trả lời {state.pace==="teacher" ? "ở câu này" : "toàn phòng"}</p></div>
      <div><strong>{stats.correct}</strong><p>Đúng</p></div>
    </div>}
    {host && <div className="inline-actions">
      {state.phase==="lobby" && <button disabled={pending} className="button primary" onClick={()=>command("start")}>Bắt đầu phòng</button>}
      {state.phase==="playing" && <button disabled={pending} className="button" onClick={()=>command("pause")}>Tạm dừng</button>}
      {state.phase==="paused" && <button disabled={pending} className="button primary" onClick={()=>command("resume")}>Tiếp tục</button>}
      {state.phase==="playing" && state.pace==="teacher" && state.index+1<state.total &&
        <button disabled={pending} className="button primary" onClick={()=>command("next")}>Chuyển câu</button>}
      {state.phase!=="ended" && <button disabled={pending} className="button" onClick={()=>command("end")}>Kết thúc phòng</button>}
      <button disabled={pending} className="button" onClick={()=>command("ranking")}>{state.rankingEnabled ? "Tắt bảng vinh danh" : "Bật bảng vinh danh"}</button>
    </div>}
    {code && state.phase==="lobby" && <button className="button primary" disabled={pending || state.ready}
      onClick={()=>execute(()=>readyLive(code))}>{state.ready ? "Đã sẵn sàng" : "Em đã sẵn sàng"}</button>}
    {code && state.phase==="playing" && state.answered && <p className="notice" role="status">
      {state.index>=state.total ? "Em đã hoàn thành tất cả câu hỏi." : "Đã lưu câu trả lời. Chờ giáo viên chuyển câu."}
    </p>}
    {state.question && <Question key={state.index} state={state} disabled={!code || state.answered || pending}
      submit={choices=>{if(code) execute(()=>answerLive(code,state.index,choices));}}/>}
    {code && state.phase==="ended" && <p>Em trả lời đúng {state.own}/{state.total} câu trong phòng này.</p>}
    {code && !!state.celebration && state.celebration>=3 && <p className="notice live-celebrate" role="status">Chúc mừng! Chuỗi tốt nhất của em là {state.celebration} câu đúng.</p>}
    {host && stats && state.pace==="student" && <details><summary>Thống kê từng câu</summary>
      <ol>{stats.questions.map((row,i)=><li key={i}>Câu {i+1} · {row.correct}/{row.responses} câu trả lời đúng</li>)}</ol>
    </details>}
    {state.ranking && <LiveRanking rows={state.ranking}/>}
    <button className="button" disabled={pending} onClick={()=>execute(async()=>({state:host ? await refreshHost(host) : await refreshGuest(code!)}))}>Đồng bộ lại</button>
  </section>;
}

function Question({state,disabled,submit}:{state:LiveState;disabled:boolean;submit:(choices:number[])=>void}) {
  const question=state.question!;
  const [chosen,setChosen]=useState<number[]>([]);
  return <section className="stack">
    <h2>Câu {state.index+1}/{state.total} · {question.prompt}</h2>
    {/* eslint-disable-next-line @next/next/no-img-element -- Private media uses short-lived signed URLs. */}
    {question.image && <img className="lesson-image" src={question.image} alt="Hình minh họa câu hỏi"/>}
    {question.audio && <audio controls src={question.audio} aria-label="Phát âm câu hỏi"/>}
    <div className="form-grid">{question.choices.map((option,i)=><div className="stack" key={i}>
      <button className={`button${chosen.includes(i) ? " primary" : ""}`} disabled={disabled} aria-pressed={chosen.includes(i)} onClick={()=>
        setChosen(old=>question.multi ? old.includes(i) ? old.filter(n=>n!==i) : [...old,i] : [i])}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Private media uses short-lived signed URLs. */}
        {option.image && <img className="lesson-image" src={option.image} alt=""/>}
        {option.image ? `Phương án ${i+1}` : option.label}{state.stats?.options[i]!==undefined ? ` · ${state.stats.options[i]} lượt` : ""}
      </button>
      {option.audio && <audio controls src={option.audio} aria-label={`Phát âm phương án ${i+1}`}/>}
    </div>)}</div>
    {state.stats===undefined && <button className="button primary" disabled={disabled || !chosen.length} onClick={()=>submit(chosen)}>Gửi câu trả lời</button>}
  </section>;
}
