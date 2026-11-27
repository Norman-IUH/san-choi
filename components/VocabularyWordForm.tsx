"use client";
import { useState } from "react";
import { levels } from "@/lib/game";
import type { BankWord } from "@/lib/vocabulary-bank";
import { saveBankWord } from "@/app/library/actions";
import { MediaInput } from "./MediaInput";

const mediaFields = [
  ["image", "image", "Ảnh từ vựng"],
  ["uk", "audio", "Phát âm Anh–Anh"],
  ["us", "audio", "Phát âm Anh–Mỹ"],
] as const;

export function VocabularyWordForm({ id, initial, assets }: {
  id: string | null;
  initial?: BankWord;
  assets: Record<string, string>;
}) {
  const [media, setMedia] = useState(() => Object.fromEntries(mediaFields.map(([field]) => {
    const path = initial?.[field];
    return [field, { path: path ?? undefined, url: path ? assets[path] : undefined }];
  })));
  const [uploads, setUploads] = useState(0);
  return <form action={saveBankWord.bind(null, id)} className="panel stack">
    <div className="form-grid">
      <label>Từ hoặc cụm từ<input name="word" required maxLength={100} defaultValue={initial?.word}/></label>
      <label>Nghĩa tiếng Việt<input name="meaning" required maxLength={240} defaultValue={initial?.meaning}/></label>
      <label>Cấp độ<select name="level" defaultValue={initial?.level ?? levels[0]}>{levels.map(level => <option key={level}>{level}</option>)}</select></label>
      <label>Chủ đề<input name="topic" required maxLength={80} defaultValue={initial?.topic}/></label>
      <label>Từ loại<input name="part" maxLength={40} defaultValue={initial?.part} placeholder="noun, verb…"/></label>
      <label>IPA<input name="ipa" maxLength={100} defaultValue={initial?.ipa}/></label>
    </div>
    <label>Câu ví dụ<textarea name="example" maxLength={400} defaultValue={initial?.example}/></label>
    <label>Từ liên quan<input name="related" maxLength={240} defaultValue={initial?.related}/></label>
    <details>
      <summary>Ảnh và phát âm</summary>
      <p className="muted">Tải bản ghi âm của giáo viên hoặc giữ bản phát âm có sẵn khi sao chép từ.</p>
      {mediaFields.map(([field, kind, label]) => <div key={field} className="bank-media">
        <input type="hidden" name={field} value={media[field].path ?? ""}/>
        {media[field].path?.startsWith("/audio/vocabulary/") && <p className="muted">Audio tổng hợp có sẵn</p>}
        <MediaInput label={label} kind={kind} path={media[field].path} url={media[field].url}
          onBusy={change => setUploads(previous => previous + change)}
          onChange={(path, url) => setMedia(previous => ({ ...previous, [field]: { path, url } }))}/>
      </div>)}
    </details>
    <button className="button primary" disabled={uploads > 0}>Lưu từ vựng</button>
  </form>;
}
