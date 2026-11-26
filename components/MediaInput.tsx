"use client";
import { useState } from "react";
import { mediaSize } from "@/lib/media";

export function MediaInput({ label, kind, path, url, onChange, onBusy }: {
  label: string;
  kind: "image" | "audio";
  path?: string;
  url?: string;
  onChange: (path?: string, url?: string) => void;
  onBusy: (change: number) => void;
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function upload(file: File) {
    if (!file.size || file.size > mediaSize) {
      setMessage("Tệp phải có dung lượng từ 1 byte đến 3 MB.");
      return;
    }
    setMessage("");
    setPending(true);
    onBusy(1);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", kind);
      const response = await fetch("/activities/media", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok || !result.path) { setMessage(result.error ?? "Chưa tải được tệp."); return; }
      onChange(result.path, result.url);
    } catch {
      setMessage("Không kết nối được khi tải tệp. Hãy thử lại.");
    } finally {
      setPending(false);
      onBusy(-1);
    }
  }

  return <div className="stack">
    <label>{label}<input type="file" disabled={pending}
      accept={kind === "image" ? "image/png,image/jpeg,image/webp" : "audio/mpeg,audio/wav,audio/ogg"}
      onChange={event => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) void upload(file);
      }}/></label>
    {url && (kind === "image" ? (
      // eslint-disable-next-line @next/next/no-img-element -- Private signed media is served directly by Storage.
      <img className="lesson-image" src={url} alt={label}/>
    ) : <audio controls preload="none" src={url} aria-label={label}/>)}
    {path && <button type="button" className="button" disabled={pending} onClick={() => onChange()}>Bỏ {label.toLocaleLowerCase("vi")}</button>}
    {pending && <p role="status">Đang tải tệp…</p>}
    {message && <p role="alert" className="notice error">{message}</p>}
  </div>;
}
