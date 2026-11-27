"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { levels, normalize, skills } from "@/lib/game";
import { difficultyLabels, type BankWord, type VocabularyLesson } from "@/lib/vocabulary-bank";
import { saveVocabularyLesson, updateWordTopics } from "@/app/library/actions";

type LessonFields = VocabularyLesson & { id?: string };
const perPage = 18;

export function VocabularyLibrary({ words, initial }: { words: BankWord[]; initial?: LessonFields }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string>(initial?.level ?? "");
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(0);
  const [chosen, setChosen] = useState(initial?.entry_keys ?? []);
  const topics = [...new Set(words.filter(word => !level || word.level === level).map(word => word.topic))].sort();
  const matching = words.filter(word => (!level || word.level === level) && (!topic || word.topic === topic) &&
    (!source || word.id.startsWith("catalog/") === (source === "catalog")) && normalize(word.word + " " + word.meaning).includes(normalize(query)));
  const pages = Math.max(1, Math.ceil(matching.length / perPage));
  const slice = matching.slice(page * perPage, (page + 1) * perPage);
  const selected = new Set(chosen);
  const selectedWords = chosen.flatMap(id => words.find(word => word.id === id) ?? []);
  const hasPrivate = selectedWords.some(word => !word.id.startsWith("catalog/"));

  function pick(id: string) {
    setChosen(previous => previous.includes(id) ? previous.filter(key => key !== id) : [...previous, id].slice(0, 60));
  }

  return <div className="bank-layout">
    <section className="panel stack" aria-labelledby="bank-title">
      <h2 id="bank-title">Ngân hàng từ vựng</h2>
      <div className="bank-filters">
        <label><span><Search size={16} aria-hidden="true"/> Tìm từ hoặc nghĩa</span>
          <input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }}/></label>
        <label>Cấp độ<select value={level} onChange={event => { setLevel(event.target.value); setTopic(""); setPage(0); }}>
          <option value="">Tất cả</option>{levels.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Chủ đề<select value={topic} onChange={event => { setTopic(event.target.value); setPage(0); }}>
          <option value="">Tất cả</option>{topics.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Nguồn<select value={source} onChange={event => { setSource(event.target.value); setPage(0); }}>
          <option value="">Tất cả</option><option value="catalog">Học liệu Sân Chơi</option><option value="mine">Từ của tôi</option></select></label>
      </div>
      <div className="inline-actions">
        <p role="status" className="muted">{matching.length} từ · Đã chọn {chosen.length}/60</p>
        {chosen.length > 0 && <a className="bank-selection-link button" href="#selection-title">Đến phần soạn bài</a>}
      </div>
      <ul className="bank-words">
        {slice.map(word => <li key={word.id}>
          <label className="bank-word">
            <input type="checkbox" checked={selected.has(word.id)} disabled={chosen.length >= 60 && !selected.has(word.id)} onChange={() => pick(word.id)}/>
            <span><strong lang="en">{word.word}</strong><span>{word.meaning}</span></span>
          </label>
          <small>{word.topic}{word.ipa ? " · " + word.ipa : ""}</small>
          <Link className="bank-edit" href={word.id.startsWith("catalog/") ? "/library/words/new?" + new URLSearchParams({ copy: word.id }) : `/library/words/${word.id}`}>
            {word.id.startsWith("catalog/") ? "Sao chép" : "Sửa"}<span className="sr-only"> {word.word}</span>
          </Link>
        </li>)}
      </ul>
      {!slice.length && <p>Không tìm thấy từ phù hợp.</p>}
      {pages > 1 && <div className="inline-actions" aria-label="Phân trang từ vựng">
        <button type="button" className="icon-button" aria-label="Trang trước" disabled={page === 0} onClick={() => setPage(page - 1)}><ArrowLeft size={17}/></button>
        <span>{page + 1} / {pages}</span>
        <button type="button" className="icon-button" aria-label="Trang sau" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}><ArrowRight size={17}/></button>
      </div>}
    </section>
    <section className="panel stack bank-selection" aria-labelledby="selection-title">
      <h2 id="selection-title">{initial?.id ? "Sửa bài học" : "Soạn bài học"}</h2>
      {!!selectedWords.length && <ul className="bank-selected">
        {selectedWords.map(word => <li key={word.id}><button className="button" type="button" onClick={() => pick(word.id)}
          aria-label={"Bỏ chọn " + word.word}>{word.word} <span aria-hidden="true">×</span></button></li>)}
      </ul>}
      <form action={saveVocabularyLesson.bind(null, initial?.id ?? null)} className="stack">
        {chosen.map(id => <input key={id} type="hidden" name="entry" value={id}/>)}
        <label>Tên bài học<input name="title" defaultValue={initial?.title} required maxLength={100}/></label>
        <div className="form-grid">
          <label>Cấp độ bài học<select name="level" defaultValue={initial?.level ?? levels[0]}>{levels.map(value => <option key={value}>{value}</option>)}</select></label>
          <label>Kỹ năng<select name="skill" defaultValue={initial?.skill ?? "Vocabulary"}>{skills.map(value => <option key={value}>{value}</option>)}</select></label>
          <label>Chủ đề bài học<input name="topic" defaultValue={initial?.topic} required maxLength={80}/></label>
          <label>Unit<input name="unit" defaultValue={initial?.unit} required maxLength={80}/></label>
        </div>
        <label>Độ khó<select name="difficulty" defaultValue={initial?.difficulty ?? "gentle"}>
          {Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button className="button primary" disabled={!chosen.length}>Lưu bài học</button>
      </form>
      <details><summary>Sửa hàng loạt từ riêng</summary>
        <form action={updateWordTopics} className="stack">
          {chosen.map(id => <input key={id} type="hidden" name="entry" value={id}/>)}
          <label>Cấp độ mới<select name="level">{levels.map(value => <option key={value}>{value}</option>)}</select></label>
          <label>Chủ đề mới<input name="topic" required maxLength={80}/></label>
          <button className="button" disabled={!hasPrivate}>Cập nhật từ đã chọn</button>
        </form>
      </details>
    </section>
  </div>;
}
