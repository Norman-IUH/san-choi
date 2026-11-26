import { templateIds, templates, type Item, type Template } from "./game";

const pairs: Item[] = [
  { prompt: "Một đôi", answers: ["2"], options: [] },
  { prompt: "Một tá", answers: ["12"], options: [] },
  { prompt: "Nửa chục", answers: ["5"], options: [] },
];
const questions: Item[] = [
  { prompt: "Hành tinh nào được gọi là hành tinh đỏ?", options: ["Sao Hỏa", "Sao Kim", "Sao Thổ"], answers: ["Sao Hỏa"] },
  { prompt: "Những vật nào phát ra ánh sáng?", options: ["Mặt Trời", "Đèn đang sáng", "Mặt Trăng"], answers: ["Mặt Trời", "Đèn đang sáng"] },
  { prompt: "Hành tinh nào nằm gần Mặt Trời nhất?", options: ["Sao Thủy", "Trái Đất", "Sao Mộc"], answers: ["Sao Thủy"] },
];

export const demoTitles = [
  "Khám phá hệ Mặt Trời", "Ghép cặp số đếm", "Những con số quen thuộc", "Chuyện nhỏ mỗi ngày",
  "Tiếng Việt quanh em", "Nhận biết con vật", "Chủ đề kể chuyện", "Con số nói gì?",
  "Thử tài thiên văn", "Xếp câu tiếng Việt", "Xếp chữ về thiên nhiên", "Hộp thử thách",
];

export function demoContent(template: Template): Item[] {
  switch (templates[template].kind) {
    case "choice": return questions;
    case "pair": return template === "group-sort" ? [
      { prompt: "Chim sẻ", answers: ["Chim"], options: [] },
      { prompt: "Cá chép", answers: ["Cá"], options: [] },
      { prompt: "Chim én", answers: ["Chim"], options: [] },
    ] : pairs;
    case "prompt": return ["Kể về một nơi em thích.", "Kể tên ba điều em nhìn thấy trong lớp.", "Miêu tả một món ăn em yêu thích."].map(prompt => ({ prompt, answers: [], options: [] }));
    case "blank": return [
      { prompt: "Mặt Trời mọc ở hướng ___.", answers: ["đông"], options: [] },
      { prompt: "Con ___ đang bơi trong hồ.", answers: ["cá"], options: [] },
    ];
    case "sequence": return [
      { prompt: "Em làm gì vào buổi sáng?", answers: ["Em", "đi", "học", "vào", "buổi sáng"], options: [] },
      { prompt: "Sắp xếp câu về thời tiết", answers: ["Hôm nay", "trời", "rất", "đẹp"], options: [] },
    ];
    case "word": return [
      { prompt: "Những giọt nước rơi từ mây", answers: ["mưa"], options: [] },
      { prompt: "Không khí chuyển động", answers: ["gió"], options: [] },
    ];
  }
}

export const demos = templateIds.map((id, index) => ({ id, ...templates[id], demoTitle: demoTitles[index] }));
