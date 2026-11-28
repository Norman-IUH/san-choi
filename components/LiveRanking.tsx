"use client";

import {useRef,useState} from "react";
import type {RankingEntry} from "@/lib/live";

export function LiveRanking({rows,percentage=false,inactive=false}:{rows:RankingEntry[];percentage?:boolean;inactive?:boolean}) {
  const panel=useRef<HTMLElement>(null);
  const [show,setShow]=useState(!inactive);
  return <section ref={panel} className="panel stack live-ranking">
    <div className="section-head"><h2>Bảng vinh danh</h2><div className="inline-actions">
      {inactive && <button className="button" onClick={()=>setShow(value=>!value)}>{show ? "Ẩn bảng" : "Hiện bảng"}</button>}
      {show && <button className="button" onClick={()=>{
        if(document.fullscreenElement) void document.exitFullscreen().catch(()=>{});
        else void panel.current?.requestFullscreen?.().catch(()=>{});
      }}>Trình chiếu bảng</button>}
    </div></div>
    {show && (rows.length ? <ol className="assignment-list">{rows.map(row=><li key={row.label}>
      <strong>Hạng {row.rank} · {row.label}</strong><span>{row.points}{percentage ? "%" : " điểm"}
        {!!row.bonus && ` · +${row.bonus} thưởng`}{!!row.best && ` · Chuỗi tốt nhất ${row.best}`}</span>
    </li>)}</ol> : <p>Chưa có điểm để vinh danh.</p>)}
  </section>;
}
