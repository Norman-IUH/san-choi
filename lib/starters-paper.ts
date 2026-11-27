import type { Item, Template } from "./game";
import { defaultRubric } from "./games/productive";
import { starterPartNames, starterPapers, type StarterPaper } from "./games/starters";

const image = (id: string) => `/illustrations/starters/${id}.webp`;
const cards = (values: string[], labels = values) => values.map((value, index) => ({ value: labels[index], image: image(value) }));
const points = (locations: number[][]) => locations.map(([x, y], i) => ({ id: String(i + 1), x, y }));
const park = image("park");
const people = points([[14, 54], [29, 58], [45, 52], [61, 61], [76, 55], [89, 57]]);
const balls = points([[14, 46], [31, 41], [47, 55], [62, 36], [76, 56], [87, 39], [36, 75]]);
type Config = NonNullable<NonNullable<Item["practice"]>["starters"]>;
type Question = [prompt: string, answer?: string, config?: Partial<Config>, audio?: string];

const listening: Question[][] = [
  [ ["Eva", "4"], ["Ben", "1"], ["Grace", "5"], ["Lily", "2"], ["Tom", "3"] ]
    .map(([name, answer]) => [name, answer, { scene: park, targets: people }, "l1"]),
  [["What is the girl's name?", "May"], ["How old is she?", "7"], ["What is her friend's name?", "Sam"],
    ["How many children are in the club?", "12"], ["What is the room number?", "4"]].map(([prompt, answer]) => [prompt, answer, {}, "l2"]),
  [
    ["What has Dad got?", "B", { cards: cards(["apple", "book", "bag"], ["A", "B", "C"]) }, "l3-1"],
    ["What is in the garden?", "C", { cards: cards(["cat", "duck", "frog"], ["A", "B", "C"]) }, "l3-2"],
    ["What does Mia want?", "A", { cards: cards(["milk", "banana", "apple"], ["A", "B", "C"]) }, "l3-3"],
    ["Which toy is on the table?", "C", { cards: cards(["kite", "ball", "train"], ["A", "B", "C"]) }, "l3-4"],
    ["What is on the chair?", "B", { cards: cards(["pencil", "hat", "bag"], ["A", "B", "C"]) }, "l3-5"],
  ],
  ["2:blue", "1:red", "4:green", "6:yellow", "5:orange"].map((answer, index) => [`Ball ${index + 1}`, answer, { scene: image("balls"), targets: balls }, "l4"]),
];

const nouns = cards(["water", "bread", "ducks", "grass", "eggs", "book", "train", "hat"]);
const facts = "Ducks\n\nYou can see ducks on a farm. Some ducks swim in (1) ___. At home, people eat (2) ___ for breakfast, but ducks can eat small plants. Baby (3) ___ can walk soon after they hatch. Ducks can walk on (4) ___ beside a pond. A mother duck lays (5) ___ in a nest.";
const examples = {
  listening: ["Ví dụ: nghe ‘Alex is on the bike’ rồi nối Alex với người đi xe.", "Ví dụ: nghe ‘It's Ann. A. N. N.’ rồi viết Ann.", "Ví dụ: nếu em nghe ‘a pen’, chọn tranh vẽ một chiếc bút.", "Ví dụ: nghe ‘Colour the biggest ball pink’ rồi chọn quả bóng lớn nhất và màu hồng."],
  reading: ["Ví dụ: thấy hình cái bút và câu ‘This is a pencil.’ thì chọn dấu ✓.", "Ví dụ: thấy một cái cây và đọc ‘There is a tree.’ thì viết yes.", "Ví dụ: hình cái bút với ba chữ n, p, e có đáp án pen.", "Tìm từ trong khung từ. Ví dụ trong câu ‘Cats drink ___.’, water hợp nghĩa.", "Ví dụ: thấy một chiếc mũ ở trên bàn thì điền table vào câu ‘It's on the ___.’"],
  speaking: [],
};
const reading: Question[][] = [
  [["This is a cat.", "tick", { scene: image("cat") }], ["This is a train.", "cross", { scene: image("kite") }],
    ["This is an apple.", "tick", { scene: image("apple") }], ["These are ducks.", "tick", { scene: image("ducks") }],
    ["This is a pencil.", "cross", { scene: image("hat") }]],
  [["A girl is flying a kite.", "yes"], ["The boy beside the tree has a book.", "yes"], ["There are two dogs in the picture.", "no"],
    ["The girl on the right is on a bike.", "yes"], ["The sky is black.", "no"]].map(([prompt, answer]) => [prompt, answer, { scene: park }]),
  [["ball", "llba"], ["frog", "gofr"], ["book", "okbo"], ["train", "nitra"], ["banana", "anbaan"]]
    .map(([answer, letters]) => ["Look at the picture and make the word.", answer, { scene: image(answer), letters }]),
  ["water", "bread", "ducks", "grass", "eggs"].map((answer, index) => [`Write the word for gap ${index + 1}.`, answer, { passage: facts, cards: nouns }]),
  [["What colour is the girl's bag?", "red", { scene: image("story-1") }], ["What is the girl holding?", "apple", { scene: image("story-1") }],
    ["Where is the cat sitting? On the ___.", "chair", { scene: image("story-2") }], ["What is on the table?", "milk", { scene: image("story-2") }],
    ["What is in the girl's hand now?", "book", { scene: image("story-3") }]],
];

const smallPictures = cards(["apple", "hat", "book", "train", "ball"]);
const speaking: Question[][] = [
  [["Listen to your teacher. Point to things in the park and place the cards.", undefined, { scene: park, cards: smallPictures, targets: people,
    teacher: "Say hello and ask the learner's first name for the role-play. Ask them to point to the dog and the tree. Show the cards. Ask them to point to the book, apple and hat. Then say: Put the apple beside the boy with the book. Put the hat next to the girl on the bike. Put the book beside the girl with the kite.",
    guide: "Point to the dog. Choose a card, then choose a person in the picture to place it beside them." }]],
  [["Look at the park picture. Answer your teacher's questions.", undefined, { scene: park,
    teacher: "Point at the kite and ask: What is this? What colour is it? How many wheels has the bike got? Tell me about the boy beside the tree.",
    guide: "Say what you can see. You can start with ‘I can see …’." }]],
  [["Look at the object cards. Answer your teacher's questions.", undefined, { cards: smallPictures,
    teacher: "Choose three cards. Ask: What is it? Have you got a toy train? Do you like apples? What colour is the ball?", guide: "Use short answers such as ‘Yes, I have’ or ‘It's red’." }]],
  [["Answer your teacher's questions about the things you like.", undefined, {
    teacher: "Ask: How old are you? What's your favourite animal? What do you like doing with your friends? Use a made-up name or answers for online demonstrations.",
    guide: "Try ‘I like …’ or ‘My favourite animal is …’." }]],
];

export function starterPaper(paper: StarterPaper, part?: number) {
  const rows = { listening, reading, speaking }[paper];
  const mock = part === undefined;
  const indices = mock ? rows.map((_, index) => index) : [part - 1];
  if (indices.some(index => !rows[index])) return null;
  const template: Template = paper === "speaking" ? "speaking" : "type-answer";
  const items: Item[] = indices.flatMap(index => rows[index].map(([prompt, answer, config, audio], question) => ({
    version: 2, prompt, answers: answer ? [answer] : [], options: [], english: { level: "Pre A1 Starters", skill: paper === "speaking" ? "Speaking" : paper === "listening" ? "Listening" : "Reading" },
    media: audio ? { audio: `/audio/starters/${audio}.wav` } : undefined,
    practice: { version: 1, mode: "starters", maxPlays: 0, showTranscript: false, reviewedAudio: false,
      starters: { paper, part: index + 1, mock, guide: examples[paper][index], ...config },
      ...(paper === "speaking" && index === indices[0] && question === 0 ? { production: { objective: false, limit: 240,
        preparation: 0, duration: 0, rubric: defaultRubric("Speaking") } } : {}) },
  })));
  return { template, items, title: `${starterPapers[paper]} · ${mock ? "Mock Test" : `Part ${part}`}`, label: mock ? starterPapers[paper] : starterPartNames[paper][part - 1] };
}
