import { templateIds, templates, type Item, type Template } from "./game";

import { isWordTemplate, type WordTemplate, truthOptions } from "./games/word-templates";

import { isArcadeTemplate } from "./games/arcade-templates";
import { arcadeDemos } from "./games/arcade-demos";
import { isPuzzleTemplate } from "./games/puzzle-templates";
import { puzzleDemos } from "./games/puzzle-demos";

const word = (prompt: string, answer: string, audio?: string): Item => ({
  prompt, answers: [answer], options: [],
  ...(audio && { english: { uk: "/audio/vocabulary/" + audio + "-uk.wav", us: "/audio/vocabulary/" + audio + "-us.wav" } }),
});
const wordDemos: Record<WordTemplate, { title: string; items: Item[] }> = {
  "type-answer": { title: "What’s in your bag?", items: [
    { ...word("What can you write with?", "pencil", "pencil"), alternatives: ["a pencil"] },
    word("What do you use to measure a line?", "ruler", "ruler"),
  ] },
  "matching-pairs": { title: "Pairs on the farm", items: [
    word("A bird that likes water", "duck", "duck"),
    word("An animal you can ride", "horse", "horse"),
    word("An animal that likes to climb", "goat", "goat"),
  ] },
  "spell-word": { title: "Listen and spell", items: [word("Listen to the classroom word.", "book", "book"), word("Spell the word for a writing tool.", "pencil", "pencil")] },
  wordsearch: { title: "Find the school words", items: [word("You carry your books in this.", "bag", "bag"), word("Use this to measure.", "ruler", "ruler")] },
  hangman: { title: "Guess the mystery word", items: [word("It swims and says quack.", "duck", "duck"), word("A place where plants grow.", "garden", "garden")] },
  crossword: { title: "Crossing words", items: [word("A pet that says meow.", "cat"), word("You carry your books in it.", "bag", "bag")] },
  "true-false": { title: "Classroom fact check", items: [
    { prompt: "A ruler helps you measure.", options: [...truthOptions], answers: ["True"] },
    { prompt: "You read a pencil.", options: [...truthOptions], answers: ["False"] },
  ] },
  "word-magnets": { title: "Make a sentence", items: [
    { prompt: "Tell a friend what you can see.", options: [], answers: ["I", "can", "see", "a duck."] },
    { prompt: "Tell a friend what is in your bag.", options: [], answers: ["There", "is", "a book", "in my bag."] },
  ] },
};

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
  if (isArcadeTemplate(template)) return arcadeDemos[template].items;
  if (isPuzzleTemplate(template)) return puzzleDemos[template].items;
  if (isWordTemplate(template)) return wordDemos[template].items;
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

export const demos = templateIds.map((id, index) => ({ id, ...templates[id], demoTitle: isArcadeTemplate(id) ? arcadeDemos[id].title : isPuzzleTemplate(id) ? puzzleDemos[id].title : isWordTemplate(id) ? wordDemos[id].title : demoTitles[index] }));
