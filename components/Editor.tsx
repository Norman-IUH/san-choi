"use client";
import { useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { saveActivity } from "@/app/activities/actions";
import { levels, skills, templates, type Item, type Template } from "@/lib/game";
import { isWordTemplate, truthOptions, wordTemplates } from "@/lib/games/word-templates";
import { isPuzzleTemplate, mathOperations, mathSymbols, pairOptions, puzzleTemplates } from "@/lib/games/puzzle-templates";
import { arcadeTemplates, defaultArcade, isArcadeTemplate } from "@/lib/games/arcade-templates";
import { MediaInput } from "./MediaInput";
import { importVocabulary } from "@/lib/vocabulary-import";
import { isPhonics, practiceModes, type PracticeMode } from "@/lib/games/practice";

export type ActivityFields = { title: string; description: string; subject: string; grade: string; tags: string;
  visibility: "private" | "public" | "unlisted" };
type Entry = Omit<Item, "answers" | "options" | "alternatives"> & { answers: string; options: string; alternatives: string };
type FormFields = ActivityFields & { content: Entry[] };
const blank: Entry = { prompt: "", answers: "", options: "", alternatives: "" };
const lines = (value: string) => value.split("\n").map(line => line.trim()).filter(Boolean);
function entryFromItem(item: Item): Entry {
  return { ...item, answers: item.answers.join("\n"), options: item.options.join("\n"), alternatives: item.alternatives?.join("\n") ?? "" };
}
function hasEntry(item: Entry) {
  return [item.prompt, item.answers, item.options, item.alternatives, item.explanation,
    ...Object.values(item.english ?? {}), ...Object.values(item.media ?? {})].some(value => value?.trim())
    || Boolean(item.optionMedia?.length);
}

export function Editor({ id, template, initial, content = [], assets: initialAssets = {}, practiceMode }: {
  id: string | null; template: Template; initial?: ActivityFields; content?: Item[]; assets?: Record<string, string>; practiceMode?: PracticeMode;
}) {
  const arcade = isArcadeTemplate(template);
  const diagram = template === "labelled-diagram";
  const compare = template === "pair-or-no-pair";
  const maths = template === "maths-generator";
  const fixedChoices = template === "true-false" ? truthOptions : compare ? pairOptions : null;
  const mode = practiceMode ?? content.find(item => item.practice)?.practice?.mode;
  const defaultEntry: Entry = mode ? { ...blank, practice: { version: 1, mode, maxPlays: 0, showTranscript: false, reviewedAudio: false } } :
    diagram ? { ...blank, pin: { x: 50, y: 50 } } : arcade ? { ...blank, arcade: defaultArcade } : maths ?
    { ...blank, prompt: "Tính kết quả.", math: { operation: "add", min: 1, max: 10 } } : blank;
  const [error, setError] = useState("");
  const [assets, setAssets] = useState(initialAssets);
  const [uploads, setUploads] = useState(0);
  const [importing, setImporting] = useState(false);
  const [pending, start] = useTransition();
  const { register, control, handleSubmit, setValue, getValues } = useForm<FormFields>({
    defaultValues: { title: "", description: "", subject: "", grade: "", tags: "", visibility: "private", ...initial,
      content: content.length ? content.map(entryFromItem) : [defaultEntry] },
  });
  const { fields, append, remove, move, replace } = useFieldArray({ control, name: "content" });
  const current = useWatch({ control, name: "content" });
  const kind = templates[template].kind;
  const alternatives = kind === "blank" || template === "type-answer";
  const wordPuzzle = ["spell-word", "wordsearch", "hangman", "crossword"].includes(template);
  const maxItems = template === "crossword" ? 10 : template === "matching-pairs" ? 12 : 60;
  const answerLabel = template === "group-sort" ? "Nhóm" : kind === "pair" ? "Mặt sau / giá trị ghép" :
    kind === "sequence" ? "Các từ theo thứ tự đúng, mỗi dòng một từ hoặc cụm từ" :
    kind === "choice" ? "Đáp án đúng, mỗi dòng một đáp án có trong phương án" : "Đáp án";
  const structureBusy = uploads > 0 || importing || pending;
  function trackUpload(change: number) { setUploads(total => total + change); }
  function remember(path?: string, url?: string) {
    if (path && url) setAssets(previous => ({ ...previous, [path]: url }));
  }

  async function importFile(file: File) {
    setError("");
    setImporting(true);
    try {
      const imported = (await importVocabulary(file)).map(entryFromItem);
      const existing = getValues("content");
      const hasContent = existing.some(hasEntry);
      if ((hasContent ? existing.length : 0) + imported.length > 60) throw new Error("Mỗi hoạt động tối đa 60 mục.");
      if (hasContent) append(imported, { shouldFocus: false }); else replace(imported);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không đọc được tệp từ vựng.");
    } finally { setImporting(false); }
  }

  return <form className="stack editor" onSubmit={handleSubmit((data, event) => {
    if (structureBusy) return;
    const draft = (event?.nativeEvent as SubmitEvent)?.submitter?.getAttribute("value") !== "publish";
    const entries = data.content.map(({ prompt, answers, options, alternatives, explanation, english, media, optionMedia, secondary, pin, math, practice, arcade: settings }) => {
      const lexical = english && {
        level: english.level || undefined, skill: english.skill || undefined, meaning: english.meaning?.trim() || undefined,
        ipa: english.ipa?.trim() || undefined, example: english.example?.trim() || undefined, uk: english.uk, us: english.us,
      };
      const choices = fixedChoices ? [...fixedChoices] : lines(options);
      return { version: 2, prompt, answers: lines(answers), options: choices, secondary: secondary?.trim() || undefined, pin, math, arcade: settings && (settings.timed || settings.difficulty !== defaultArcade.difficulty) ? settings : undefined,
        explanation: explanation?.trim() || undefined, alternatives: lines(alternatives ?? ""),
        english: lexical && Object.values(lexical).some(Boolean) ? lexical : undefined,
        practice: practice && { ...practice, stimulus: practice.stimulus?.trim() || undefined, transcript: practice.transcript?.trim() || undefined },
        media: media?.image || media?.audio ? media : undefined,
        optionMedia: optionMedia?.filter(item => choices.includes(item.option) && (item.image || item.audio)),
      };
    });
    const payload = draft ? entries.filter(item => item.prompt.trim() || item.answers.length || item.options.length ||
      item.english || item.media || item.optionMedia?.length || item.alternatives.length || item.explanation) : entries;
    setError("");
    start(async () => {
      const result = await saveActivity(id, { ...data, template, draft, content: payload });
      if (result?.error) setError(result.error);
    });
  })}>
    <div className="panel stack">
      <label>Tên hoạt động<input {...register("title")} required maxLength={120}/></label>
      <label>Mô tả<textarea {...register("description")} maxLength={1000}/></label>
      <div className="form-grid"><label>Môn học<input {...register("subject")} maxLength={80}/></label>
        <label>Khối lớp<input {...register("grade")} maxLength={40}/></label>
        <label>Thẻ<input {...register("tags")} maxLength={250}/></label>
        <label>Quyền xem<select {...register("visibility")}><option value="private">Riêng tư</option><option value="unlisted">Có link</option><option value="public">Công khai</option></select></label></div>
    </div>
    <h2>Nội dung</h2>
    {isArcadeTemplate(template) && <p className="hint">{arcadeTemplates[template].instruction} Mỗi mục có một đáp án đúng và ít nhất một phương án nhiễu.</p>}
    {isPuzzleTemplate(template) && <p className="hint">{puzzleTemplates[template].instruction}</p>}
    {isWordTemplate(template) && <p className="hint">{wordTemplates[template].instruction}
      {wordPuzzle && " Dùng từ tiếng Anh 2–12 chữ cái."}
      {template === "crossword" && " Nhập 2–10 từ có chữ cái giao nhau."}
      {template === "matching-pairs" && " Nhập 2–12 cặp, mỗi mặt sau khác nhau."}
    </p>}
    {(template === "flash-cards" || template === "match-up" || template === "find-match") && <div className="panel stack">
      <label>Nhập từ vựng CSV hoặc XLSX<input type="file" accept=".csv,.xlsx" disabled={structureBusy} onChange={event => {
        const file = event.target.files?.[0]; event.target.value = ""; if (file) void importFile(file);
      }}/></label><p className="muted">Cột bắt buộc: word, meaning. Cột tùy chọn: ipa, example, level.</p>
      {importing && <p role="status">Đang đọc từ vựng…</p>}
    </div>}
    {fields.map((field, i) => {
      const item = current[i];
      const options = fixedChoices ? [...fixedChoices] : [...new Set(lines(item?.options ?? ""))];
      return <fieldset className="panel stack" key={field.id}><legend>Mục {i + 1}</legend>
      <label>{kind === "blank" ? "Câu có dấu ___ ở chỗ trống" : kind === "pair" ? "Mặt trước / nội dung" : "Câu hỏi hoặc gợi ý"}
        <textarea {...register(`content.${i}.prompt`)} maxLength={400} rows={2}/></label>
      {item?.practice && <section className="stack">
        <strong>{practiceModes[item.practice.mode]}</strong>
        <label>Hướng dẫn hoặc ngữ cảnh hiển thị<textarea {...register(`content.${i}.practice.stimulus`)} maxLength={1000}/></label>
        <label>Số lượt nghe tối đa (0 là không giới hạn)<input type="number" min={0} max={10} {...register(`content.${i}.practice.maxPlays`, { valueAsNumber: true })}/></label>
        {item.practice.mode === "dialogue" && <>
          <label>Transcript<textarea {...register(`content.${i}.practice.transcript`)} maxLength={1000}/></label>
          <label className="check"><input type="checkbox" {...register(`content.${i}.practice.showTranscript`)}/> Hiện transcript cho học sinh</label>
        </>}
        {isPhonics(item.practice.mode) && <label className="check">
          <input type="checkbox" {...register(`content.${i}.practice.reviewedAudio`)}/> Tôi đã nghe và kiểm tra âm mẫu trong bản ghi
        </label>}
        <p className="hint">Đính kèm clip trong Học liệu tiếng Anh và tệp.</p>
      </section>}
      {arcade && <div className="form-grid">
        <label>Độ khó<select {...register(`content.${i}.arcade.difficulty`)} defaultValue="gentle">
          <option value="gentle">Chậm · luyện tập</option><option value="steady">Vừa</option><option value="challenge">Nhanh · thử thách</option>
        </select></label>
        <label className="check"><input type="checkbox" {...register(`content.${i}.arcade.timed`)}/> Giới hạn thời gian mục này</label>
      </div>}
      {compare && <label>Nội dung thẻ thứ hai<textarea {...register(`content.${i}.secondary`)} maxLength={400}/></label>}
      {diagram && <><div className="form-grid"><label>Vị trí ngang của ghim (%)<input type="number" min="0" max="100" step="any" {...register(`content.${i}.pin.x`, { valueAsNumber: true })}/></label>
        <label>Vị trí dọc của ghim (%)<input type="number" min="0" max="100" step="any" {...register(`content.${i}.pin.y`, { valueAsNumber: true })}/></label></div>
        {item?.media?.image && assets[item.media.image] && <button className="diagram-picture pin-editor" type="button"
          aria-label="Đặt vị trí ghim trên ảnh. Có thể nhập tọa độ bằng bàn phím."
          onClick={event => {
            if (!event.detail) return;
            const box = event.currentTarget.getBoundingClientRect();
            const coordinate = (position: number, start: number, size: number) => Math.min(100, Math.max(0, Math.round((position - start) * 100 / size)));
            setValue(`content.${i}.pin`, { x: coordinate(event.clientX, box.left, box.width), y: coordinate(event.clientY, box.top, box.height) });
          }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Uploaded media is already signed by Storage. */}
          <img className="lesson-image" src={assets[item.media.image]} alt="Xem trước sơ đồ"/>
          <span className="diagram-pin" aria-hidden="true" style={{ left: (item.pin?.x ?? 50) + "%", top: (item.pin?.y ?? 50) + "%" }}>+</span>
        </button>}
      </>}
      {maths && <div className="form-grid"><label>Phép tính<select {...register(`content.${i}.math.operation`)}>
        {mathOperations.map(operation => <option value={operation} key={operation}>{mathSymbols[operation]}</option>)}</select></label>
        <label>Số nhỏ nhất<input type="number" min="0" max="30" {...register(`content.${i}.math.min`, { valueAsNumber: true })}/></label>
        <label>Số lớn nhất<input type="number" min="0" max="30" {...register(`content.${i}.math.max`, { valueAsNumber: true })}/></label></div>}
      {kind === "choice" && !fixedChoices && <label>Phương án, mỗi dòng một phương án<textarea {...register(`content.${i}.options`)} rows={3}/></label>}
      {fixedChoices ? <label>Đáp án<select {...register(`content.${i}.answers`)}><option value="">Chọn đáp án</option>
        {fixedChoices.map(value => <option key={value}>{value}</option>)}</select></label>
        : kind !== "prompt" && !maths && <label>{answerLabel}<textarea {...register(`content.${i}.answers`)} rows={kind === "choice" || kind === "sequence" ? 3 : 1}/></label>}
      {alternatives && <label>Đáp án thay thế (mỗi dòng một đáp án)<textarea {...register(`content.${i}.alternatives`)} rows={2}/></label>}
      <details className="lesson-details"><summary>Học liệu tiếng Anh và tệp</summary><div className="stack">
        <div className="form-grid"><label>Cấp độ<select {...register(`content.${i}.english.level`)}><option value="">Chưa chọn</option>
          {levels.map(level => <option key={level}>{level}</option>)}</select></label>
          <label>Kỹ năng<select {...register(`content.${i}.english.skill`)}><option value="">Chưa chọn</option>
          {skills.map(skill => <option key={skill}>{skill}</option>)}</select></label>
          <label>Nghĩa tiếng Việt<input {...register(`content.${i}.english.meaning`)} maxLength={400}/></label>
          <label>IPA<input {...register(`content.${i}.english.ipa`)} maxLength={100}/></label></div>
        <label>Câu ví dụ<textarea {...register(`content.${i}.english.example`)} maxLength={400}/></label>
        <label>Giải thích đáp án<textarea {...register(`content.${i}.explanation`)} maxLength={800}/></label>
        <div className="form-grid">
          {(["image", "audio"] as const).map(kind => {
            const path = item?.media?.[kind];
            return <MediaInput key={kind} label={kind === "image" ? "Ảnh câu hỏi" : "Âm thanh câu hỏi"} kind={kind}
              path={path} url={path && assets[path]} onBusy={trackUpload} onChange={(path, url) => {
                remember(path, url); setValue(`content.${i}.media.${kind}`, path);
              }}/>;
          })}
          {(["uk", "us"] as const).map(accent => {
            const path = item?.english?.[accent];
            return <MediaInput key={accent} label={accent === "uk" ? "Phát âm Anh–Anh" : "Phát âm Anh–Mỹ"} kind="audio"
              path={path} url={path && assets[path]} onBusy={trackUpload} onChange={(path, url) => {
                remember(path, url); setValue(`content.${i}.english.${accent}`, path);
              }}/>;
          })}
        </div>
        {kind === "choice" && options.slice(0, 8).map(option => <details key={option} className="lesson-details"><summary>Tệp cho phương án {option}</summary>
          <div className="form-grid">{(["image", "audio"] as const).map(kind => {
            const path = item?.optionMedia?.find(media => media.option === option)?.[kind];
            return <MediaInput key={kind} label={kind === "image" ? "Ảnh phương án" : "Âm thanh phương án"} kind={kind}
              path={path} url={path && assets[path]} onBusy={trackUpload} onChange={(path, url) => {
                remember(path, url);
                const previous = getValues(`content.${i}.optionMedia`) ?? [];
                const media = { ...previous.find(entry => entry.option === option), option, [kind]: path };
                setValue(`content.${i}.optionMedia`, [...previous.filter(entry => entry.option !== option), media].filter(entry => entry.image || entry.audio));
              }}/>;
          })}</div></details>)}
      </div></details>
      <div className="inline-actions">
        <button type="button" className="icon-button" aria-label={`Đưa mục ${i + 1} lên`} disabled={structureBusy || !i} onClick={() => move(i, i - 1)}><ArrowUp size={16}/></button>
        <button type="button" className="icon-button" aria-label={`Đưa mục ${i + 1} xuống`} disabled={structureBusy || i === fields.length - 1} onClick={() => move(i, i + 1)}><ArrowDown size={16}/></button>
        <button type="button" className="icon-button" aria-label={`Xóa mục ${i + 1}`} disabled={structureBusy} onClick={() => remove(i)}><Trash2 size={16}/></button>
      </div>
    </fieldset>; })}
    <button type="button" className="button" disabled={structureBusy || fields.length >= maxItems} onClick={() => append(defaultEntry)}><Plus size={16}/> Thêm mục</button>
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="inline-actions editor-actions"><button className="button primary" value="publish" disabled={structureBusy}>Xuất bản</button>
      <button className="button" value="draft" disabled={structureBusy}>Lưu nháp</button>{pending && <span role="status">Đang lưu…</span>}</div>
  </form>;
}
