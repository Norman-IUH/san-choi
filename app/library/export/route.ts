import { account } from "@/lib/supabase";
import { csv } from "@/lib/csv";
import { bankColumns } from "@/lib/vocabulary-bank";
import { vocabularyCatalog } from "@/lib/vocabulary-catalog";
import { listBankWords } from "@/lib/vocabulary-server";

export async function GET() {
  const { db, user } = await account(true);
  const words = [...vocabularyCatalog, ...await listBankWords(db, user.id)];
  return new Response(csv([[...bankColumns], ...words.map(word => bankColumns.map(column => word[column]))]), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="san-choi-vocabulary.csv"',
      "Cache-Control": "private, no-store" },
  });
}
