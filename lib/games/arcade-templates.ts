export const c1Templates = {
  "maze-chase": { title: "Maze Chase", kind: "choice", icon: "⌗", color: "mint", instruction: "Đi qua mê cung và chạm vào từ đúng. Dùng phím mũi tên hoặc tay cầm trên màn hình." },
  "flying-fruit": { title: "Flying Fruit", kind: "choice", icon: "◈", color: "peach", instruction: "Quan sát những quả đang bay rồi chạm vào quả mang đáp án em chọn." },
  airplane: { title: "Airplane", kind: "choice", icon: "➤", color: "blue", instruction: "Lái máy bay vào đúng làn để chạm vào mục tiêu. Dùng phím lên xuống hoặc chạm vào làn bay." },
} as const;

export const c2Templates = {
  "balloon-pop": { title: "Balloon Pop", kind: "choice", icon: "◌", color: "violet", instruction: "Chạm vào bóng bay mang đáp án để làm bóng nổ." },
  "whack-a-mole": { title: "Whack-a-Mole", kind: "choice", icon: "◍", color: "mint", instruction: "Chờ chú chuột chũi mang đáp án xuất hiện rồi chạm vào chú." },
  "speed-sorting": { title: "Speed Sorting", kind: "choice", icon: "▥", color: "blue", instruction: "Kéo thẻ vào đúng thùng hoặc chạm thẻ rồi chọn thùng." },
  "win-or-lose-quiz": { title: "Win or Lose Quiz", kind: "choice", icon: "✦", color: "violet", instruction: "Chơi an toàn để nhận một điểm khi đúng, hoặc thử sức một lần để nhận hai điểm khi đúng và mất một điểm khi sai." },
} as const;

export const arcadeTemplates = { ...c1Templates, ...c2Templates };
export type ArcadeTemplate = keyof typeof arcadeTemplates;
export const isArcadeTemplate = (value: string): value is ArcadeTemplate => Object.hasOwn(arcadeTemplates, value);
export const hasArcadeCanvas = (template: ArcadeTemplate) => template !== "speed-sorting" && template !== "win-or-lose-quiz";
export const riskMarker = "☆ thử sức";
export const difficultyLevels = ["gentle", "steady", "challenge"] as const;
export type Difficulty = typeof difficultyLevels[number];
export const defaultArcade = { difficulty: "gentle", timed: false } as const;
export const arcadeWorlds = {
  "maze-chase": { tile: 0, colors: ["#102c24", "#69d4b8", "#216e53"] },
  "flying-fruit": { tile: 1, colors: ["#512a21", "#ffd584", "#ae5124"] },
  airplane: { tile: 2, colors: ["#152b58", "#a8e7ff", "#2761a0"] },
  "balloon-pop": { tile: 3, colors: ["#4b2658", "#ffd891", "#8a4386"] },
  "whack-a-mole": { tile: 4, colors: ["#163b34", "#c8ec9a", "#3b6d46"] },
  "speed-sorting": { tile: 5, colors: ["#123e51", "#9ce8de", "#236982"] },
  "win-or-lose-quiz": { tile: 6, colors: ["#201445", "#ffd375", "#6647a4"] },
} as const;
