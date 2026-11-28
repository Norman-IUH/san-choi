import Link from "next/link";
import {account,check} from "@/lib/supabase";
import {vocabularyCatalog} from "@/lib/vocabulary-catalog";
import {ActivityGenerator} from "@/components/ActivityGenerator";

export default async function GeneratePage() {
  const {db,user}=await account(true);
  const [lessons,words]=await Promise.all([
    db.from("vocabulary_lessons").select("id,title").eq("owner_id",user.id).order("title"),
    db.from("vocabulary_entries").select("topic").eq("owner_id",user.id).is("archived_at",null).order("topic"),
  ]);
  check(lessons.error,"generator_lessons");check(words.error,"generator_topics");
  const topics=[...new Set([...vocabularyCatalog.map(row=>row.topic),...(words.data ?? []).map(row=>String(row.topic))])].sort();
  return <div className="narrow wide stack"><Link href="/activities/new">← Tạo hoạt động</Link>
    <h1>Tạo hoạt động nhanh</h1><p>Chọn học liệu để tạo bản nháp. Kiểm tra câu hỏi trong trình soạn trước khi xuất bản.</p>
    <ActivityGenerator topics={topics} lessons={lessons.data ?? []}/>
  </div>;
}
