"use client";
import { useState } from "react";
import { Copy } from "lucide-react";
export function CopyLink({ url }: { url: string }) {
  const [message, setMessage] = useState("");
  return <div className="stack"><label>Link chia sẻ<input readOnly value={url} onFocus={event => event.target.select()}/></label>
    <button className="button" onClick={async () => {
      try { await navigator.clipboard.writeText(url); setMessage("Đã sao chép link."); }
      catch { setMessage("Chọn link rồi dùng lệnh sao chép của thiết bị."); }
    }}><Copy size={16}/> Sao chép link</button>{message && <p role="status">{message}</p>}</div>;
}
