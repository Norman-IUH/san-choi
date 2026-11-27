import type { Item, Template } from "./game";
import type { Rubric } from "./games/productive";
import { cambridgeCounts, cambridgeLevels, flyerPartNames, starterPapers, type CambridgePart, type StarterPaper } from "./games/starters";

const picture = (name: string) => `/illustrations/flyers/${name}.webp`;
const pictureCards = (names: string[]) => names.map((name, i) => ({ value: "ABCDEFGH"[i], image: picture(name) }));
const schoolTrip = ["Meeting place", "Guide's surname", "Time", "Number of groups", "Thing to bring"];
const people = [[11, 76], [27, 79], [42, 74], [58, 79], [74, 76], [89, 79]].map(([x, y], i) => ({ id: String(i + 1), x, y }));
const objects = [[14, 61, "flag"], [38, 69, "flask"], [64, 70, "lantern"]].map(([x, y, name], i) => ({
  id: String(i + 1), x: Number(x), y: Number(y), mask: picture("colour-" + name),
}));
type Question = { prompt: string; answer?: string; alternatives?: string[]; config?: Partial<CambridgePart>; clip?: string };

const listening: Question[][] = [
  [["Owen", "3"], ["Holly", "5"], ["Finn", "1"], ["Mina", "2"], ["Nina", "6"]].map(([prompt, answer]) => ({
    prompt, answer, clip: "l1", config: { scene: picture("station"), targets: people,
      example: "Ví dụ: nghe ‘Jamie is holding a flag’ rồi nối Jamie với người cầm cờ." },
  })),
  ["harbour", "Reed", "10:15", "3", "raincoat"].map((answer, i) => ({
    prompt: schoolTrip[i], answer, alternatives: i === 2 ? ["10.15", "quarter past ten"] : i === 3 ? ["three"] : undefined,
    clip: "l2", config: { passage: "Coastal Discovery Club · Saturday trip", fields: schoolTrip,
      example: "Khi nghe một tên đánh vần hoặc một giờ hẹn, điền chính thông tin đó vào dòng tương ứng." },
  })),
  [["Ruth", "E"], ["Adam", "B"], ["Sophie", "G"], ["Paul", "C"], ["Liam", "H"]].map(([name, answer], i) => ({
    prompt: `What did ${name} pack for the trip?`, answer, clip: "l3", config: {
      lead: { value: name, image: picture(`portrait-${i + 1}`) },
      cards: pictureCards(["suitcase", "compass", "gloves", "shell", "notebook", "flask", "binoculars", "lantern"]),
      example: "Ví dụ: nếu em nghe rằng Alex mang một chiếc bình, hãy tìm hình chiếc bình và chọn chữ bên dưới." },
  })),
  ([
    ["What will Emma use to see the boats?", "C", ["notebook", "umbrella", "binoculars"]],
    ["What did Felix leave in the bus?", "A", ["gloves", "rope", "raincoat"]],
    ["What did Eva draw in her notebook?", "B", ["boat", "lighthouse", "shell"]],
    ["What shall Tom take to the cave?", "C", ["whistle", "kite", "flashlight"]],
    ["Which thing did Sara find on the beach?", "A", ["shell", "flask", "compass"]],
  ] satisfies [string, string, string[]][]).map(([prompt, answer, images], i) => ({
    prompt, answer, clip: `l4-${i + 1}`, config: { cards: pictureCards(images), example: "Nghe cả đoạn rồi chọn một trong ba hình A, B hoặc C." },
  })),
  ([
    ["Colour the object in instruction 1.", "1:purple"],
    ["Write one word on the left sign.", "boats", "left"],
    ["Colour the object in instruction 3.", "2:green"],
    ["Colour the object in instruction 4.", "3:orange"],
    ["Write one word on the right sign.", "shop", "right"],
  ] satisfies [string, string, ("left" | "right")?][]).map(([prompt, answer, signPosition]) => ({
    prompt, answer, clip: "l5", config: { scene: picture("colour-hut"), targets: objects, sign: !!signPosition, signPosition,
      example: "Chọn đúng vật và màu khi nghe yêu cầu tô. Khi nghe yêu cầu viết, điền một từ vào đúng bảng." },
  })),
];

const papers: Partial<Record<StarterPaper, Question[][]>> = { listening };
const rubrics: Partial<Record<StarterPaper, Rubric>> = {};

export function flyerPaper(paper: StarterPaper, part?: number) {
  const rows = papers[paper];
  if (!rows || (part !== undefined && (!Number.isInteger(part) || !rows[part - 1]))) return null;
  const mock = part === undefined;
  const indices = mock ? rows.map((_, i) => i) : [part - 1];
  const template: Template = paper === "speaking" ? "speaking" : "type-answer";
  const rubric = paper === "speaking" || (paper === "reading" && (mock || part === 7)) ? rubrics[paper] : undefined;
  const items: Item[] = indices.flatMap(index => rows[index].map(({ prompt, answer, alternatives, config, clip }, question) => ({
    version: 2, prompt, answers: answer ? [answer] : [], options: [], alternatives,
    english: { level: cambridgeLevels.flyers, skill: paper === "listening" ? "Listening" : paper === "reading" ? "Reading" : "Speaking" },
    media: clip ? { audio: `/audio/flyers/${clip}.wav` } : undefined,
    practice: { version: 1, mode: "starters", maxPlays: 0, showTranscript: false, reviewedAudio: false,
      starters: { level: "flyers", paper, part: index + 1, mock, ...config },
      ...(rubric && index === indices[0] && question === 0 ? {
        production: { objective: false, limit: 800, preparation: 0, duration: 0, rubric },
      } : {}),
    },
  })));
  const counts = cambridgeCounts({ level: "flyers", paper });
  if (indices.some(index => rows[index].length !== counts[index])) throw new Error("Invalid Flyers paper length");
  return { template, items, title: `A2 Flyers · ${starterPapers[paper]} · ${mock ? "Mock Test" : `Part ${part}`}`,
    label: mock ? starterPapers[paper] : flyerPartNames[paper][part - 1] };
}
