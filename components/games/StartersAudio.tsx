"use client";
import { useRef, useState } from "react";

export function StartersAudio({ url, mock, session }: { url: string; mock: boolean; session?: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const key = `san-choi-starters-listens:${session}:${url}`;
  const [listens, setListens] = useState(() => {
    try { return Number(sessionStorage.getItem(key)) || 0; } catch { return 0; }
  });
  const [state, setState] = useState<"ready" | "playing" | "paused">("ready");
  const [failed, setFailed] = useState(false);
  const opening = useRef(false);
  return <div className="starter-audio">
    <audio ref={audio} src={url} preload="none" onPause={event => {
      if (!event.currentTarget.ended) setState("paused");
    }} onEnded={() => setState("ready")} onError={() => { setFailed(true); setState("ready"); }}/>
    <button className="button" type="button" disabled={mock && listens >= 2 && state === "ready"} onClick={async () => {
      const player = audio.current;
      if (!player || opening.current) return;
      if (state === "playing") { player.pause(); return; }
      opening.current = true;
      try {
        if (state === "ready") player.currentTime = 0;
        await player.play();
        setFailed(false);
        if (state !== "paused") {
          setListens(listens + 1);
          try { sessionStorage.setItem(key, String(listens + 1)); } catch { /* The player still counts within this view. */ }
        }
        setState("playing");
      } catch { setFailed(true); }
      finally { opening.current = false; }
    }}>{state === "playing" ? "Dừng nghe" : state === "paused" ? "Nghe tiếp" : "Nghe đoạn hội thoại"}</button>
    {mock && <span>Lượt nghe {listens}/2</span>}
    {failed && <span role="alert">Không phát được âm thanh. Hãy thử lại.</span>}
  </div>;
}
