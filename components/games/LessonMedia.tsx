import { createContext, useContext } from "react";
import type { Media, PlayItem } from "@/lib/games/model";

export const RefreshLessonMedia = createContext<((url: string) => void) | undefined>(undefined);

export function LessonMedia({ media, assets, label }: { media?: Media; assets: Record<string, string>; label: string }) {
  const refresh = useContext(RefreshLessonMedia);
  const image = media?.image && assets[media.image];
  const audio = media?.audio && assets[media.audio];
  return <>{image && (
    // eslint-disable-next-line @next/next/no-img-element -- Private signed media is served directly by Storage.
    <img className="lesson-image" src={image} alt={label} onError={() => refresh?.(image)} />
  )}{audio && <audio aria-label={label} controls preload="none" src={audio} onError={() => refresh?.(audio)}/>}</>;
}

export function Pronunciation({ item, assets }: { item: PlayItem; assets: Record<string, string> }) {
  const refresh = useContext(RefreshLessonMedia);
  return <>{(["uk", "us"] as const).map(accent => {
    const path = item.pronunciation?.[accent];
    const label = accent === "uk" ? "Anh–Anh" : "Anh–Mỹ";
    return path && assets[path] && <div key={accent} className="pronunciation"><strong>{label}</strong>
      {path.startsWith("/audio/vocabulary/") && <small>Audio tổng hợp</small>}
      <audio aria-label={label} controls preload="none" src={assets[path]} onError={() => refresh?.(assets[path])}/></div>;
  })}</>;
}
