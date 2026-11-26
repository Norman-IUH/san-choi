import type { CSSProperties } from "react";

const sectors = ["#ffc662", "#aee7df", "#dcc5fa", "#ffb1a4", "#fff2a5", "#bed6ff", "#efbdfa", "#bfe3a0"];

export function Wheel({ labels, selected, spun }: { labels: string[]; selected: number; spun: boolean }) {
  const step = 360 / labels.length;
  const gradient = labels.map((_, index) => sectors[index] + " " + index * step + "deg " + (index + 1) * step + "deg").join(", ");
  return <div className="quiz-wheel" aria-hidden="true">
    <span className="wheel-pointer"/>
    <div className={"wheel-disc" + (spun ? " wheel-spinning" : "")}
      style={{ backgroundImage: "conic-gradient(" + gradient + ")", "--wheel-rotation": (1440 - (selected + .5) * step) + "deg" } as CSSProperties}>
      {labels.map((label, index) => <span className="wheel-caption" key={index}
        style={{ "--sector-angle": (index + .5) * step + "deg" } as CSSProperties}>{label}</span>)}
    </div>
  </div>;
}
