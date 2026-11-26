import { useId } from "react";

export function Progress({ value, total }: { value: number; total: number }) {
  const id = useId();
  return <div className="progress-label"><span id={id}>Mục {value} / {total}</span><progress aria-labelledby={id} value={value} max={total}/></div>;
}
