"use client";
export function ConfirmButton({ children, message }: { children: string; message: string }) {
  return <button className="button danger" onClick={event => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</button>;
}
