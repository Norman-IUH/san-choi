"use client";
import { useEffect, useRef, useState } from "react";

const mimeTypes = ["audio/webm;codecs=opus", "audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/ogg;codecs=opus"];

export function VoiceRecorder({ endpoint, secondsLimit, onBusy }: { endpoint: string; secondsLimit: number; onBusy: (busy: boolean) => void }) {
  const [phase, setPhase] = useState<"ready" | "requesting" | "recording" | "captured" | "saving" | "stored" | "deleting">("ready");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [url, setUrl] = useState<string>();
  const stream = useRef<MediaStream>(null);
  const recorder = useRef<MediaRecorder>(null);
  const clip = useRef<Blob>(null);
  const objectUrl = useRef<string>(null);
  const alive = useRef(false);
  const busy = phase !== "ready" && phase !== "stored";

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    void fetch(endpoint, { signal: controller.signal }).then(async response => {
      if (!response.ok) return;
      const existing: { saved?: boolean; url?: string } = await response.json();
      if (alive.current && existing.saved) {
        setPhase(previous => previous === "ready" ? "stored" : previous);
        setUrl(previous => previous ?? existing.url);
      }
    }).catch(() => {});
    return () => {
      alive.current = false;
      controller.abort();
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach(track => track.stop());
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, [endpoint]);

  useEffect(() => { onBusy(busy); }, [busy, onBusy]);

  useEffect(() => {
    if (phase !== "recording") return;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.min(secondsLimit, Math.floor((Date.now() - started) / 1000))), 200);
    const stop = setTimeout(() => { if (recorder.current?.state === "recording") recorder.current.stop(); }, secondsLimit * 1000);
    return () => { clearInterval(timer); clearTimeout(stop); };
  }, [phase, secondsLimit]);

  async function record() {
    setError("");
    const type = typeof MediaRecorder === "function" && mimeTypes.find(mime => MediaRecorder.isTypeSupported(mime));
    if (!type || !navigator.mediaDevices?.getUserMedia) { setError("Trình duyệt chưa hỗ trợ ghi âm ở đây."); return; }
    setPhase("requesting");
    try {
      const input = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (!alive.current) { input.getTracks().forEach(track => track.stop()); return; }
      stream.current = input;
      const capture = new MediaRecorder(input, { mimeType: type, audioBitsPerSecond: 48000 });
      const parts: Blob[] = [];
      recorder.current = capture;
      let failed = false;
      capture.ondataavailable = event => { if (event.data.size) parts.push(event.data); };
      capture.onerror = () => {
        failed = true;
        input.getTracks().forEach(track => track.stop());
        if (alive.current) { setPhase("ready"); setError("Ghi âm bị gián đoạn. Hãy thử lại."); }
      };
      capture.onstop = () => {
        input.getTracks().forEach(track => track.stop());
        if (!alive.current || failed) return;
        const audio = new Blob(parts, { type: capture.mimeType || type });
        if (!audio.size || audio.size > 2 * 1024 * 1024) { setPhase("ready"); setError("Bản ghi trống hoặc vượt quá 2 MB."); return; }
        clip.current = audio;
        objectUrl.current = URL.createObjectURL(audio);
        setUrl(objectUrl.current);
        setPhase("captured");
      };
      capture.start(250);
      setElapsed(0);
      setPhase("recording");
    } catch (cause) {
      stream.current?.getTracks().forEach(track => track.stop());
      if (alive.current) {
        setPhase("ready");
        setError(cause instanceof DOMException && cause.name === "NotAllowedError"
          ? "Quyền microphone chưa được cấp. Em có thể tiếp tục bằng ghi chú hoặc xin quyền lại." : "Chưa mở được microphone.");
      }
    }
  }

  async function save() {
    if (!clip.current) return;
    setError(""); setPhase("saving");
    try {
      const result = await fetch(endpoint, { method: "POST", body: clip.current });
      if (!result.ok) throw new Error((await result.json()).error);
      setPhase("stored");
    } catch (cause) { setPhase("captured"); setError(cause instanceof Error ? cause.message : "Chưa lưu được bản ghi."); }
  }

  async function remove() {
    setError("");
    if (phase === "stored") {
      setPhase("deleting");
      try {
        const result = await fetch(endpoint, { method: "DELETE" });
        if (!result.ok) throw new Error((await result.json()).error);
      } catch (cause) { setPhase("stored"); setError(cause instanceof Error ? cause.message : "Chưa xóa được bản ghi."); return; }
    }
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
    clip.current = null;
    setUrl(undefined); setPhase("ready");
  }

  return <section className="panel stack" aria-label="Ghi âm phần nói">
    <p>Chỉ bật microphone khi em bấm ghi âm. Em được nghe và xóa trước khi gửi cho giáo viên.</p>
    {phase === "ready" && <button className="button" type="button" onClick={() => void record()}>Bật microphone và ghi âm</button>}
    {phase === "requesting" && <p role="status">Đang xin quyền microphone.</p>}
    {phase === "recording" && <div className="inline-actions"><span role="timer">Đang ghi · {elapsed}/{secondsLimit} giây</span>
      <button className="button" type="button" onClick={() => recorder.current?.stop()}>Dừng ghi âm</button></div>}
    {url && <audio controls src={url} aria-label="Nghe lại bản ghi" preload="none"/>}
    {phase === "stored" && <p role="status">Đã lưu bản ghi.</p>}
    {(phase === "captured" || phase === "stored") && <div className="inline-actions">
      {phase === "captured" && <button className="button primary" type="button" onClick={() => void save()}>Lưu bản ghi</button>}
      <button className="button" type="button" onClick={() => void remove()}>Xóa bản ghi để ghi lại</button>
    </div>}
    {phase === "saving" && <p role="status">Đang lưu bản ghi.</p>}
    {phase === "deleting" && <p role="status">Đang xóa bản ghi.</p>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
