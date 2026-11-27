import Link from "next/link";
import { z } from "zod";
import { levels, normalize } from "@/lib/game";
import { mediaUrls } from "@/lib/media-server";
import { account } from "@/lib/supabase";
import { vocabularyCatalog } from "@/lib/vocabulary-catalog";
import { wordItem } from "@/lib/vocabulary-bank";
import { currentWordReview, listWordReviews, wordReviewStates, wordSignature } from "@/lib/vocabulary-review-server";
import { listBankWords } from "@/lib/vocabulary-server";
import { reviewWord } from "./actions";

const perPage = 20;
export const metadata = { title: "Duyệt học liệu" };

export default async function VocabularyReview({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ db, user }, query] = await Promise.all([account(true), searchParams]);
  const level = z.enum(levels).safeParse(query.level).data;
  const state = z.enum(["pending", "changes", "approved"]).safeParse(query.state).data;
  const search = typeof query.q === "string" ? query.q.slice(0, 100) : "";
  const [words, reviews] = await Promise.all([listBankWords(db, user.id), listWordReviews(db, user.id)]);
  const filtered = [...vocabularyCatalog, ...words].filter(word => (!level || word.level === level) &&
    (!state || currentWordReview(word, reviews.get(word.id)) === state) && normalize(`${word.word} ${word.meaning}`).includes(normalize(search)));
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const page = Math.min(z.coerce.number().int().min(1).safeParse(query.page).data ?? 1, pages);
  const displayed = filtered.slice((page - 1) * perPage, page * perPage);
  const assets = await mediaUrls(displayed.map(word => wordItem(word)), user.id);
  const filter = (position: number) => new URLSearchParams({ ...(level && { level }), ...(state && { state }), q: search, page: String(position) }).toString();
  return <div className="narrow wide stack bank-page"><Link className="back" href="/library">← Thư viện tiếng Anh</Link>
    <h1>Duyệt học liệu từ vựng</h1>
    {query.result && <p className="notice" role="status">{query.result === "saved" ? "Đã lưu trạng thái duyệt." : query.result === "changed"
      ? "Nội dung từ đã thay đổi. Hãy kiểm tra bản mới trước khi lưu." : "Kiểm tra trạng thái và độ dài nhận xét."}</p>}
    <form action="/library/review" className="panel stack"><div className="form-grid">
      <label>Từ hoặc nghĩa<input name="q" type="search" defaultValue={search} maxLength={100}/></label>
      <label>Cấp độ<select name="level" defaultValue={level ?? ""}><option value="">Tất cả</option>{levels.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Trạng thái duyệt<select name="state" defaultValue={state ?? ""}><option value="">Tất cả</option>
        {Object.entries(wordReviewStates).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </div><button className="button">Lọc học liệu</button></form>
    <p>{filtered.length} mục phù hợp</p>
    {displayed.map(word => {
      const record = reviews.get(word.id);
      const current = currentWordReview(word, record);
      const catalog = word.id.startsWith("catalog/");
      return <article className="panel stack" key={word.id}><div className="section-head">
        <div><h2 lang="en">{word.word}</h2><p>{word.meaning} · {word.part || "Chưa có từ loại"} · {word.level} · {word.topic}</p></div>
        <Link className="button" href={catalog ? `/library/words/new?${new URLSearchParams({ copy: word.id })}` : `/library/words/${word.id}`}>
          {catalog ? "Sao chép vào kho riêng" : "Chỉnh nội dung"}</Link>
      </div>
        <p>{word.ipa || "Chưa có IPA"}</p><p lang="en">{word.example || "Chưa có câu ví dụ"}</p>
        <div className="inline-actions">{(["uk", "us"] as const).map(accent => {
          const source = word[accent] && assets[word[accent]];
          return source && <div key={accent}><p>{accent === "uk" ? "Anh–Anh" : "Anh–Mỹ"}</p>
            <audio controls preload="none" src={source} aria-label={accent === "uk" ? "Nghe Anh–Anh" : "Nghe Anh–Mỹ"}/></div>;
        })}</div>
        <p><strong>{wordReviewStates[current]}</strong>{record?.reviewed_at && current !== "pending" ? ` · ${new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(record.reviewed_at))}` : ""}</p>
        <form action={reviewWord.bind(null, word.id, filter(page), wordSignature(word))} className="stack" key={wordSignature(word)}>
          <label>Nhận xét duyệt<textarea name="note" defaultValue={record?.note} rows={2} maxLength={1500}/></label>
          <div className="inline-actions">{Object.entries(wordReviewStates).map(([key, label]) =>
            <button type="submit" className={`button${key === "approved" ? " primary" : ""}`} key={key} name="state" value={key}>{label}</button>)}</div>
        </form>
      </article>;
    })}
    {pages > 1 && <nav className="inline-actions" aria-label="Trang duyệt học liệu">
      {page > 1 && <Link className="button" href={`/library/review?${filter(page - 1)}`}>Trang trước</Link>}
      <span>{page}/{pages}</span>{page < pages && <Link className="button" href={`/library/review?${filter(page + 1)}`}>Trang sau</Link>}
    </nav>}
  </div>;
}
