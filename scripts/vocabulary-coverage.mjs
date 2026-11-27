import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";

// Node 24 runs the catalog's TypeScript directly. Resolve its app-style relative imports here.
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const source = new URL(specifier + ".ts", context.parentURL);
    if (existsSync(fileURLToPath(source))) return next(source.href, context);
  }
  return next(specifier, context);
} });

const { vocabularyCatalog } = await import("../lib/vocabulary-catalog.ts");
const { vocabularyBatchB2, vocabularyTeacherReviews } = await import("../lib/vocabulary-batch-b2.ts");
const { bankWordSchema } = await import("../lib/vocabulary-bank.ts");
const { levels, normalize } = await import("../lib/game.ts");
const expectedParts = new Set(["noun", "number", "adjective", "preposition", "adverb", "verb phrase", "verb"]);
const issues = [];
const ids = new Set();
const senses = new Set();
const batchIds = new Set();
const variants = new Map();
const spellings = new Map([["color", "colour"], ["gray", "grey"], ["yogurt", "yoghurt"], ["apologize", "apologise"]]);
const publicRoot = new URL("../public/", import.meta.url);
const fields = ["meaning", "part", "topic", "ipa", "example", "image", "uk", "us", "related"];
const mediaFields = ["image", "uk", "us"];

function verifyAsset(path, field) {
  if (!path?.startsWith("/")) return false;
  const file = new URL(path.slice(1), publicRoot);
  if (!existsSync(file)) return false;
  if (field === "image") return true;
  const data = readFileSync(file);
  return data.length >= 44 && data.subarray(0, 4).toString() === "RIFF" && data.subarray(8, 12).toString() === "WAVE";
}

if (!vocabularyBatchB2.source.trim() || !vocabularyBatchB2.rights.trim()) issues.push("Cần ghi nguồn và quyền dùng của lô V1.5B2.");
for (const [id, ipa, example] of vocabularyBatchB2.entries) {
  if (batchIds.has(id)) issues.push(`Mục lặp trong lô: ${id}`);
  if (!/^\/[\p{L}\p{M}ˈˌː .]+\/$/u.test(ipa) || !/^[A-Z].*[.!?]$/.test(example)) issues.push(`IPA hoặc ví dụ cần kiểm tra định dạng: ${id}`);
  batchIds.add(id);
}
for (const [id, review] of Object.entries(vocabularyTeacherReviews)) {
  if (!batchIds.has(id) || !review.reviewer.trim() || !review.note.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(review.date) || !Number.isFinite(Date.parse(review.date))) {
    issues.push(`Hồ sơ duyệt thiếu thông tin: ${id}`);
  }
}
for (const word of vocabularyCatalog) {
  const schema = bankWordSchema.safeParse(word);
  if (!schema.success || !expectedParts.has(word.part) || !word.meaning.trim() || !word.topic.trim()) issues.push(`Kiểm tra nghĩa, từ loại, chủ đề và schema: ${word.id}`);
  if (ids.has(word.id)) issues.push(`ID lặp: ${word.id}`);
  const sense = [word.level, normalize(word.word), normalize(word.meaning)].join("|");
  if (senses.has(sense)) issues.push(`Từ và nghĩa trùng trong cấp độ: ${word.id}`);
  const compact = normalize(word.word).replace(/[\s-]/g, "");
  const base = spellings.get(compact) ?? compact;
  if (!variants.has(base)) variants.set(base, []);
  variants.get(base).push(word.id);
  ids.add(word.id);
  senses.add(sense);
  for (const field of mediaFields) if (word[field] && !verifyAsset(word[field], field)) issues.push(`Thiếu hoặc sai tệp ${field}: ${word.id}`);
}
for (const id of batchIds) if (!ids.has(id)) issues.push(`Mục lô không có trong danh mục: ${id}`);
if (issues.length) throw new Error(issues.join("\n"));

function coverage(label, entries) {
  const counts = fields.map(field => entries.filter(word => !!word[field]).length);
  return `| ${[label, entries.length, ...counts, entries.filter(word => word.review === "teacher-reviewed").length].join(" | ")} |`;
}
const beginning = vocabularyCatalog.filter(word => levels.slice(0, 2).some(level => word.level === level));
const variantGroups = [...variants.values()].filter(group => group.length > 1);
const text = [
  "# Độ phủ học liệu V1.5B2", "", "Tệp sinh từ danh mục và tệp media trong repo bằng `npm run vocabulary:coverage`.", "",
  "| Cấp độ | Tổng | Nghĩa VI | Từ loại | Chủ đề | IPA | Ví dụ | Ảnh theo từ | Audio UK | Audio US | Từ liên quan | Giáo viên đã duyệt |",
  "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ...levels.map(level => coverage(level, vocabularyCatalog.filter(word => word.level === level))),
  coverage("Tổng", vocabularyCatalog), "",
  `Kids và Starters có ${beginning.filter(word => word.ipa && word.example).length}/${beginning.length} mục với cả IPA và câu ví dụ. ` +
    `Còn ${beginning.filter(word => !(word.uk && word.us)).length} mục Kids/Starters thiếu cặp audio và ${beginning.filter(word => !word.image).length} mục chưa có ảnh theo từ. Ảnh chỉ gắn khi hỗ trợ nhận diện.`, "",
  `Lô B2 bổ sung ${batchIds.size} mục với IPA và ví dụ. ${vocabularyCatalog.filter(word => word.review === "pending").length} mục của lô đang chờ giáo viên duyệt. ` +
    "Học liệu từ các bản trước chưa có nhật ký duyệt theo quy trình này.", "",
  `Nguồn lô B2. ${vocabularyBatchB2.source} IPA đã được hiệu chỉnh một số quy ước và cách đọc Anh–Anh sau khi tạo. ` +
    "Công cụ kiểm tra định dạng và tệp. Giáo viên xác nhận nghĩa, từ loại, chủ đề, ví dụ và phát âm bằng lượt rà soát riêng. [eSpeak NG](https://github.com/espeak-ng/espeak-ng)", "",
  `Quyền sử dụng. ${vocabularyBatchB2.rights} Ba hình nhận diện táo, sách và thước do Sân Chơi vẽ cho Listen and Choose. ` +
    "Hai ảnh liên kết sẵn trong kho thuộc bộ minh họa Sân Chơi. Audio của các bản trước giữ nguồn theo tài liệu dự án.", "",
  `Đã kiểm tra ID và nghĩa lặp chính xác trong cùng cấp độ. Có ${variantGroups.length} nhóm trùng mặt chữ hoặc biến thể chính tả để đối chiếu: ` +
    (variantGroups.map(group => group.map(id => `\`${id}\``).join(" ↔ ")).join(", ") || "không có") + ".", "",
  "Để duyệt một mục, kiểm tra nghĩa, từ loại, chủ đề, IPA, câu ví dụ và clip hiện có. Ghi người duyệt, ngày và nhận xét tại `vocabularyTeacherReviews`, rồi sinh lại báo cáo. Kiểm tra CI cục bộ bằng `npm run vocabulary:check`.",
].join("\n") + "\n";
const report = new URL("../docs/VOCABULARY_COVERAGE.md", import.meta.url);
if (process.argv.includes("--check")) {
  if (readFileSync(report, "utf8").replace(/\r\n/g, "\n") !== text) throw new Error("Chạy npm run vocabulary:coverage để cập nhật báo cáo.");
} else writeFileSync(report, text);
console.log(`Đã kiểm tra ${ids.size} mục từ, ${batchIds.size} mục lô B2.`);
