"use client";
import { useEffect, useRef, useState } from "react";
import type { PaperOptions } from "@/lib/worksheet";

export function WorksheetPreview({ endpoint, title, keys, transcript }: { endpoint: string; title: string; keys: boolean; transcript: boolean }) {
  const [preview, setPreview] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return <div className="stack">
    <form className="panel stack" onSubmit={async event => {
      event.preventDefault();
      if (running.current) return;
      running.current = true;
      setPending(true);
      setError("");
      const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ?? "preview";
      const form = new FormData(event.currentTarget);
      const version: PaperOptions["version"] = action === "key" || action === "transcript" ? action : "worksheet";
      try {
        const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...Object.fromEntries(form), colour: form.has("colour"), version }) });
        if (!response.ok || !response.headers.get("content-type")?.startsWith("application/pdf")) throw Error("Unable to print");
        const url = URL.createObjectURL(await response.blob());
        if (action === "preview") setPreview(url);
        else {
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = version === "key" ? "dap-an.pdf" : version === "transcript" ? "transcript.pdf" : "bai-tap-san-choi.pdf";
          anchor.click();
          window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
        }
      } catch { setError("Chưa tạo được PDF. Hãy kiểm tra phiên đăng nhập và thử lại."); }
      finally { running.current = false; setPending(false); }
    }}>
      <div className="form-grid">
        <label>Tiêu đề<input name="title" maxLength={140} defaultValue={title}/></label>
        {keys && <>
          <label>Tên học sinh<input name="student" maxLength={80} placeholder="Để trống cho học sinh điền"/></label>
          <label>Lớp<input name="className" maxLength={80}/></label>
          <label>Ngày<input name="date" type="date"/></label>
        </>}
        <label>Khổ giấy<select name="paper"><option>A4</option><option>Letter</option></select></label>
        <label>Cỡ chữ<select name="fontSize" defaultValue="12">{[10, 12, 14, 16].map(size => <option key={size} value={size}>{size} pt</option>)}</select></label>
      </div>
      <label>Hướng dẫn<textarea name="instructions" rows={2} maxLength={1000}/></label>
      <label className="check"><input type="checkbox" name="colour" defaultChecked/> In màu</label>
      <div className="inline-actions">
        <button className="button primary" value="preview" disabled={pending}>Xem trước PDF</button>
        <button className="button" value="download" disabled={pending}>Tải PDF</button>
        {keys && <button className="button" value="key" disabled={pending}>Tải đáp án PDF</button>}
        {transcript && <button className="button" value="transcript" disabled={pending}>Tải transcript PDF</button>}
      </div>
      {pending && <p role="status">Đang tạo PDF…</p>}
      {error && <p role="alert" className="notice error">{error}</p>}
    </form>
    {preview && <section className="panel stack">
      <div className="section-head"><h2>Bản xem trước</h2>
        <a href={preview} target="_blank" rel="noopener noreferrer" className="button">Mở PDF để in</a>
      </div>
      <iframe className="worksheet-preview" title="Xem trước phiếu PDF" src={preview}/>
    </section>}
  </div>;
}
