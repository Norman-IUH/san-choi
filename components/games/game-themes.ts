import { templateIds, type Template } from "@/lib/game";

const instructions: Record<Template, string> = {
  quiz: "Đọc câu hỏi và chọn đáp án phù hợp.",
  "match-up": "Nối mỗi thẻ với đáp án tương ứng.",
  "flash-cards": "Đọc mặt trước rồi lật thẻ để xem nghĩa và ví dụ.",
  speaking: "Bốc từng đề và trả lời thành tiếng.",
  sentence: "Đọc câu và điền từ còn thiếu.",
  "group-sort": "Đưa từng thẻ vào nhóm phù hợp.",
  wheel: "Quay vòng để chọn chủ đề tiếp theo.",
  "find-match": "Tìm thẻ có nội dung khớp với gợi ý.",
  gameshow: "Lên sân khấu và chọn một câu để nhân đôi điểm.",
  unjumble: "Chọn từng từ theo thứ tự để ghép thành câu.",
  anagram: "Xếp các chữ cái thành từ đúng.",
  "open-box": "Mở từng hộp để khám phá thử thách.",
};

export function gameTheme(template: Template) {
  const position = templateIds.indexOf(template);
  return { instruction: instructions[template], artPosition: (position % 4) * (100 / 3) + "% " + Math.floor(position / 4) * 50 + "%" };
}
