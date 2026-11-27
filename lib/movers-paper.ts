import type { Item, Template } from "./game";
import { cambridgeLevels, moverPartNames, starterPapers, cambridgeCounts, type CambridgePart, type StarterPaper } from "./games/starters";

const image = (name: string) => `/illustrations/movers/${name}.webp`;
const cards = (names: string[], labels = names) => names.map((name, i) => ({ value: labels[i], image: image(name) }));
const points = (positions: [number, number][]) => positions.map(([x, y], i) => ({ id: String(i + 1), x, y }));
type Question = { prompt: string; answer?: string; alternatives?: string[]; config?: Partial<CambridgePart>; clip?: string };
const fair = image("fair");
const people = points([[12, 75], [26, 81], [43, 73], [60, 81], [76, 75], [89, 82]]);
const booking = ["Day", "Person in charge", "Number of children", "Room", "What to bring"];
const objects = cards(["scarf", "map", "camera", "bottle", "torch", "basket", "drum", "helmet"], ["A", "B", "C", "D", "E", "F", "G", "H"]);
const stall = image("colour-stall");
const stallTargets = points([[12, 50], [28, 76], [42, 50], [80, 56], [89, 76]]);

const listening: Question[][] = [
  [["Nora", "2"], ["Jake", "6"], ["Kim", "1"], ["Maya", "5"], ["Louis", "3"]].map(([prompt, answer]) => ({
    prompt, answer, clip: "l1", config: { scene: fair, targets: people, example: "Ví dụ: nghe tên và việc một người đang làm, rồi chọn số bên dưới người đó." },
  })),
  ["Saturday", "Hall", "16", "9", "bottle"].map((answer, index) => ({
    prompt: booking[index], answer, ...(index === 2 && { alternatives: ["sixteen"] }), ...(index === 3 && { alternatives: ["nine"] }),
    clip: "l2", config: { passage: "School club visit · Booking form", fields: booking, example: "Ví dụ: nghe ‘at ten o’clock’ và viết 10 vào ô giờ bắt đầu." },
  })),
  [["Eva", "F"], ["Sam", "C"], ["Jill", "E"], ["Dan", "A"], ["Lucy", "B"]].map(([name, answer], i) => ({
    prompt: `What did ${name} bring?`, answer, clip: "l3", config: { lead: cards([`portrait-${i + 1}`], [name])[0], cards: objects,
      example: "Ví dụ: nghe về món đồ Ben mang theo. Nếu em nghe ‘a drum’, hãy ghép Ben với thẻ có hình chiếc trống." },
  })),
  [
    ["What did Ben leave at home?", "C", ["camera", "bottle", "scarf"]],
    ["What did Zoe find behind the bench?", "A", ["basket", "helmet", "map"]],
    ["What will Lily drink from?", "B", ["lemon", "bottle", "sandwich"]],
    ["What is Harry going to take a photo of?", "A", ["bird", "flower", "rabbit"]],
    ["What does Anna need for the dark room?", "C", ["umbrella", "clock", "torch"]],
  ].map(([prompt, answer, options], index) => ({
    prompt: prompt as string, answer: answer as string, clip: `l4-${index + 1}`,
    config: { cards: cards(options as string[], ["A", "B", "C"]), example: "Ví dụ: nghe ‘She bought the shoe’, rồi chọn chữ cái dưới hình chiếc giày." },
  })),
  ["1:purple", "3:green", "2:blue", "open", "4:orange"].map((answer, index) => ({
    prompt: index === 3 ? "Write one word on the sign." : `Colour instruction ${index + 1}`,
    answer, clip: "l5", config: { scene: stall, targets: stallTargets, sign: index === 3,
      example: "Ví dụ: nghe vị trí và màu rồi chọn vật, như chiếc trống bên trái. Khi nghe yêu cầu viết, điền từ vào bảng." },
  })),
];

const papers: Partial<Record<StarterPaper, Question[][]>> = { listening };
export function moverPaper(paper: StarterPaper, part?: number) {
  const rows = papers[paper];
  const mock = part === undefined;
  if (!rows || (!mock && (!Number.isInteger(part) || !rows[part - 1]))) return null;
  const indices = mock ? rows.map((_, index) => index) : [part - 1];
  const template: Template = paper === "speaking" ? "speaking" : "type-answer";
  const items: Item[] = indices.flatMap(index => rows[index].map(({ prompt, answer, alternatives, config, clip }) => ({
    version: 2, prompt, answers: answer ? [answer] : [], options: [], alternatives,
    english: { level: cambridgeLevels.movers, skill: paper === "listening" ? "Listening" : paper === "reading" ? "Reading" : "Speaking" },
    media: clip ? { audio: `/audio/movers/${clip}.wav` } : undefined,
    practice: { version: 1, mode: "starters", maxPlays: 0, showTranscript: false, reviewedAudio: false,
      starters: { level: "movers", paper, part: index + 1, mock, ...config },
    },
  })));
  const expected = cambridgeCounts({ level: "movers", paper });
  if (indices.some(index => rows[index].length !== expected[index])) throw new Error("Invalid Movers paper length");
  return { template, items, title: `A1 Movers · ${starterPapers[paper]} · ${mock ? "Mock Test" : `Part ${part}`}`,
    label: mock ? starterPapers[paper] : moverPartNames[paper][part - 1] };
}
