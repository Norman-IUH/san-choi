import { z } from "zod";

export const wordTemplates = {
  "type-answer": { title: "Type the Answer", kind: "text", icon: "⌨", color: "violet", instruction: "Đọc hoặc nghe gợi ý, rồi gõ câu trả lời." },
  "matching-pairs": { title: "Matching Pairs", kind: "pair", icon: "▧", color: "mint", instruction: "Lật một thẻ bên trái và một thẻ bên phải để ghép cặp." },
  "spell-word": { title: "Spell the Word", kind: "text", icon: "Aa", color: "peach", instruction: "Gõ từng chữ cái vào các ô để đánh vần." },
  wordsearch: { title: "Wordsearch", kind: "text", icon: "⊞", color: "blue", instruction: "Tìm từ theo gợi ý và chọn ô đầu, ô cuối trong lưới." },
  hangman: { title: "Hangman", kind: "text", icon: "◇", color: "violet", instruction: "Đoán chữ cái để tìm từ trước khi hết sáu lượt đoán sai." },
  crossword: { title: "Crossword", kind: "text", icon: "⊟", color: "mint", instruction: "Giải các gợi ý và dùng chữ cái giao nhau để hoàn thành ô chữ." },
  "true-false": { title: "True or False", kind: "choice", icon: "✓", color: "blue", instruction: "Đọc nhận định và quyết định đúng hay sai." },
  "word-magnets": { title: "Word Magnets", kind: "sequence", icon: "▰", color: "peach", instruction: "Kéo hoặc chọn các nam châm từ để xếp câu, rồi kiểm tra thứ tự." },
} as const;

export type WordTemplate = keyof typeof wordTemplates;
export const isWordTemplate = (value: string): value is WordTemplate => Object.hasOwn(wordTemplates, value);
export const truthOptions = ["True", "False"] as const;
export const englishPuzzleWord = z.string().regex(/^[a-z]{2,12}$/i);
