export const puzzleTemplates = {
  "labelled-diagram": { title: "Labelled Diagram", kind: "choice", icon: "⌖", color: "mint", instruction: "Quan sát chiếc ghim trên hình rồi đặt nhãn phù hợp." },
  "flip-tiles": { title: "Flip Tiles", kind: "pair", icon: "▤", color: "violet", instruction: "Đoán nghĩa hoặc đọc to từ ở mặt trước rồi lật ô để tự kiểm tra." },
  "rank-order": { title: "Rank Order", kind: "sequence", icon: "⇅", color: "peach", instruction: "Kéo thẻ hoặc dùng mũi tên để sắp từ vị trí đầu đến vị trí cuối." },
  "pair-or-no-pair": { title: "Pair or No Pair", kind: "choice", icon: "⋈", color: "mint", instruction: "So sánh hai thẻ rồi quyết định chúng có ghép thành một cặp hay không." },
  "image-quiz": { title: "Image Quiz", kind: "choice", icon: "▣", color: "blue", instruction: "Chọn bức hình khớp với từ hoặc gợi ý." },
  "watch-memorize": { title: "Watch and Memorize", kind: "sequence", icon: "◫", color: "violet", instruction: "Nhìn thứ tự thẻ, tự chọn lúc che đi rồi xếp lại từ trí nhớ." },
  "maths-generator": { title: "Maths Generator", kind: "text", icon: "＋", color: "blue", instruction: "Đọc phép tính được tạo và nhập kết quả theo tốc độ của em." },
} as const;

export type PuzzleTemplate = keyof typeof puzzleTemplates;
export const isPuzzleTemplate = (value: string): value is PuzzleTemplate => Object.hasOwn(puzzleTemplates, value);
export const pairOptions = ["Pair", "No Pair"] as const;
export const mathOperations = ["add", "subtract", "multiply", "divide"] as const;
export const mathSymbols = { add: "+", subtract: "−", multiply: "×", divide: "÷" } as const;

export function reorderRank(order: number[], tile: number, destination: number) {
  const position = order.indexOf(tile);
  if (position === -1 || position === destination || destination < 0 || destination >= order.length) return order;
  const updated = [...order];
  updated.splice(position, 1);
  updated.splice(destination, 0, tile);
  return updated;
}

export function mathProblem(config: { operation: typeof mathOperations[number]; min: number; max: number }, index: number) {
  const { operation, min, max } = config;
  const width = max - min + 1;
  const a = min + ((Math.imul(index + 11, 2654435761) >>> 0) % width);
  const b = min + ((Math.imul(index + 31, 2246822519) >>> 0) % width);
  const [left, right] = operation === "subtract" ? [Math.max(a, b), Math.min(a, b)] :
    operation === "divide" ? [a * Math.max(1, b), Math.max(1, b)] : [a, b];
  const answer = operation === "add" ? left + right : operation === "subtract" ? left - right :
    operation === "multiply" ? left * right : left / right;
  return { left, right, symbol: mathSymbols[operation], answer: String(answer) };
}
