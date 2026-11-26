export const c1Templates = {
  "maze-chase": { title: "Maze Chase", kind: "choice", icon: "⌗", color: "mint", instruction: "Đi qua mê cung và chạm vào từ đúng. Dùng phím mũi tên hoặc tay cầm trên màn hình." },
  "flying-fruit": { title: "Flying Fruit", kind: "choice", icon: "◈", color: "peach", instruction: "Quan sát những quả đang bay rồi chạm vào quả mang đáp án em chọn." },
  airplane: { title: "Airplane", kind: "choice", icon: "➤", color: "blue", instruction: "Lái máy bay vào đúng làn để chạm vào mục tiêu. Dùng phím lên xuống hoặc chạm vào làn bay." },
} as const;

export const arcadeTemplates = { ...c1Templates };
export type ArcadeTemplate = keyof typeof arcadeTemplates;
export const isArcadeTemplate = (value: string): value is ArcadeTemplate => Object.hasOwn(arcadeTemplates, value);
export const difficultyLevels = ["gentle", "steady", "challenge"] as const;
export type Difficulty = typeof difficultyLevels[number];
export const defaultArcade = { difficulty: "gentle", timed: false } as const;
export const arcadeWorlds = {
  "maze-chase": { tile: 0, colors: ["#102c24", "#69d4b8", "#216e53"] },
  "flying-fruit": { tile: 1, colors: ["#512a21", "#ffd584", "#ae5124"] },
  airplane: { tile: 2, colors: ["#152b58", "#a8e7ff", "#2761a0"] },
} as const;
