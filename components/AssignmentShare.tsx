"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CopyLink } from "./CopyLink";

const subscribe = () => () => {};

export function AssignmentShare({ path, fallback, title }: { path: string; fallback: string; title: string }) {
  const origin = useSyncExternalStore(subscribe, () => window.location.origin, () => "");
  const url = origin ? new URL(path, origin).toString() : fallback;
  const [requested, setRequested] = useState(false);
  const [code, setCode] = useState<{ url: string; png: string; svg: string }>();
  const [failed, setFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!requested || !origin) return;
    let cancelled = false;
    void import("qrcode").then(async qr => {
      const settings = { margin: 4, width: 720, errorCorrectionLevel: "M" } as const;
      const [png, svg] = await Promise.all([qr.toDataURL(url, settings), qr.toString(url, { ...settings, type: "svg" })]);
      if (!cancelled) setCode({ url, png, svg: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg) });
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [origin, requested, url]);
  const current = code?.url === url ? code : undefined;
  return <>
    <CopyLink url={url}/>
    {!requested && <div className="inline-actions"><button type="button" className="button" onClick={() => setRequested(true)}>Mở mã QR</button></div>}
    {requested && !current && <p role={failed ? "alert" : "status"}>{failed ? "Chưa tạo được mã QR. Hãy tải lại trang." : "Đang tạo mã QR…"}</p>}
    {current && <>
      <figure className="assignment-qr-print">
        <figcaption>{title}</figcaption>
        {/* eslint-disable-next-line @next/next/no-img-element -- Generated locally from the current assignment URL. */}
        <img alt="Mã QR bài giao" width={240} height={240} src={current.png}/>
        <p>{url}</p>
      </figure>
      <div className="inline-actions">
        <a className="button" href={current.png} download="ma-qr-bai-giao.png">Tải QR PNG</a>
        <a className="button" href={current.svg} download="ma-qr-bai-giao.svg">Tải QR SVG</a>
        <button type="button" className="button" onClick={() => {
          document.body.dataset.printAssignmentQr = "true";
          try { window.print(); } finally { delete document.body.dataset.printAssignmentQr; }
        }}>In mã QR</button>
        <button type="button" className="button primary" onClick={() => {
          const panel = dialog.current;
          panel?.showModal();
          if (panel?.requestFullscreen) void panel.requestFullscreen().catch(() => {});
        }}>Trình chiếu QR</button>
      </div>
      <dialog ref={dialog} className="assignment-qr-show" aria-label="Trình chiếu QR" onClose={() => {
        if (document.fullscreenElement === dialog.current) void document.exitFullscreen().catch(() => {});
      }}>
        <h2>{title}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element -- A local data URL. */}
        <img alt="Quét mã QR để mở bài giao" width={720} height={720} src={current.png}/>
        <p>{url}</p>
        <form method="dialog"><button className="button">Thoát trình chiếu QR</button></form>
      </dialog>
    </>}
  </>;
}
