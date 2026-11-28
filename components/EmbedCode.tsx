"use client";

import {useState,useSyncExternalStore} from "react";

const subscribe=()=>()=>{};
export function EmbedCode({path,fallback}:{path:string;fallback:string}) {
  const origin=useSyncExternalStore(subscribe,()=>window.location.origin,()=>"");
  const source=origin ? new URL(path,origin).toString() : fallback;
  const code=`<iframe src="${source}" title="Sân Chơi" width="100%" height="580" style="border:0" loading="lazy" allowfullscreen></iframe>`;
  const [copied,setCopied]=useState(false);
  return <details className="panel"><summary>Nhúng hoạt động</summary>
    <div className="stack"><label>Mã iframe<textarea rows={3} readOnly value={code}
      onFocus={event=>event.currentTarget.select()}/></label>
      <button type="button" className="button" onClick={async()=>{
        try { await navigator.clipboard.writeText(code);setCopied(true); }
        catch { setCopied(false); }
      }}>Sao chép mã nhúng</button>
      {copied && <p role="status">Đã sao chép.</p>}
    </div>
  </details>;
}
