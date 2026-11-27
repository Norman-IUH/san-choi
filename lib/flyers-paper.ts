import type { Item, Template } from "./game";
import { defaultRubric, type Rubric } from "./games/productive";
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

const definitions = ["architect", "dictionary", "diary", "passenger", "astronaut", "lighthouse", "envelope", "magazine",
  "platform", "tent", "compass", "umbrella", "binoculars", "mechanic", "thermometer"];
const conversation = [
  "Guide: What are you hoping to see at the coast?",
  "Guide: Bring your binoculars, then. Have you got some?",
  "Guide: I can lend you a pair. Have you ever used binoculars before?",
  "Guide: Don't worry. I'll show you on the way. Where will you wait for us?",
  "Guide: Good. Shall we meet there at quarter past ten?",
];
const replies = [
  "Only once, and I couldn't see clearly.", "There were five in the box.", "I'd love to see the seabirds.",
  "No, I forgot to bring mine.", "It was built a long time ago.", "By the ticket office at the harbour.",
  "Yes, see you there at ten fifteen.", "No, he doesn't live here now.",
];
const wordBank = ["worried", "climbed", "rope", "dry", "storm", "noisy", "watched", "torch"];
const rescue = "A (1) ___ blew across the beach on Saturday. Nia was (2) ___ because her kite had caught in a tree near the path. Her brother (3) ___ onto a low wall so that he could see the kite. They found a (4) ___ and used it to pull the branch down gently. Luckily, the kite was still (5) ___ under the leaves. They carried it home before it began to rain again.";
const tides = "Tides\n\nTides (1) ___ the regular rise and fall of the sea. They happen because the moon pulls (2) ___ the water. As Earth (3) ___, the level of the sea changes. Many places have two high tides (4) ___ day. Visitors often (5) ___ the beach at low tide. They may find small crabs (6) ___ rocks. Walkers should (7) ___ the beach before the sea covers the path. Check the tide times (8) ___ you go. On windy days, the water may rise (9) ___ than expected. Carrying a map is (10) ___ good idea.";
const story = "The red notebook\n\nOn Monday, Dara borrowed her neighbour's red notebook to write down the names of seabirds. She put it in the front pocket of her backpack. At the harbour, her class waited under a blue shelter because it was drizzling. When they got on the boat, Dara could not find the notebook. She asked the guide for help. The guide telephoned the ticket office. A passenger had found the notebook beside a wooden bench and had taken it to the office. After the trip, Dara picked it up. She gave the passenger a thank-you card and wrote about the trip when she got home.";
const letter = "Dear Kit,\n\nThanks (1) ___ your message. I'm sorry I (2) ___ not write yesterday. I was busy helping my uncle, (3) ___ works beside the harbour. The weather was cold, (4) ___ the trip was fun. Would you like (5) ___ come with us next time?\n\nSee you soon,\nDara";
const reading: Question[][] = [
  [
    ["This person plans how buildings will look.", "architect"],
    ["You can use this book to find out what a word means.", "dictionary"],
    ["People write about their own day in this book.", "diary"],
    ["This person travels in a vehicle which someone else is driving.", "passenger"],
    ["This person travels into space.", "astronaut"],
    ["Ships see the light from this tower near the sea.", "lighthouse"],
    ["You put a letter inside this before you post it.", "envelope"],
    ["You wait here beside the railway tracks before you get on a train.", "platform"],
    ["You can use this to find north without a phone.", "compass"],
    ["This measures how hot or cold something is.", "thermometer"],
  ].map(([prompt, answer]) => ({ prompt, answer, config: { wordBank: definitions, copyWord: true,
    example: "Ví dụ: ‘This is something you wear on your feet.’ Nếu có từ shoes trong khung, viết shoes vào ô." } })),
  ["C", "D", "A", "F", "G"].map((answer, i) => ({
    prompt: conversation[i], answer, config: { responses: replies, example: "Đọc các lượt nói liên tiếp và chọn chữ A–H cho câu đáp phù hợp." },
  })),
  [
    ...["storm", "worried", "climbed", "rope", "dry"].map((answer, i) => ({
      prompt: `Write the word for gap ${i + 1}.`, answer,
      config: { passage: rescue, wordBank, copyWord: true, example: "Xem nghĩa của cả câu rồi kiểm tra từ cần điền là danh từ, tính từ hay động từ." },
    })),
    { prompt: "Which title fits the whole story best?", answer: "Saving the kite",
      config: { passage: rescue, choices: ["Buying a new coat", "Saving the kite", "A boat trip in the storm"], example: "Chọn tiêu đề bao quát sự việc chính." } },
  ],
  ([
    [["is", "are", "be"], "are"], [["at", "to", "on"], "on"], [["turn", "turns", "turning"], "turns"],
    [["each", "all", "everywhere"], "each"], [["visited", "visiting", "visit"], "visit"],
    [["under", "until", "across"], "under"], [["leaves", "leave", "leaving"], "leave"],
    [["before", "where", "because"], "before"], [["highest", "higher", "high"], "higher"], [["any", "a", "an"], "a"],
  ] satisfies [string[], string][]).map(([choices, answer], i) => ({
    prompt: `Choose and copy the word for gap ${i + 1}.`, answer,
    config: { passage: tides, choices, copyWord: true, example: "Dùng từ trước và sau chỗ trống để chọn dạng ngữ pháp phù hợp." },
  })),
  ([
    ["Dara borrowed a ___ notebook.", "red"],
    ["She put it in the ___ of her backpack.", "front pocket"],
    ["The class waited under a ___ at the harbour.", "blue shelter"],
    ["Dara asked ___ to help her find it.", "the guide", ["a guide", "guide"]],
    ["The passenger found it beside a ___.", "wooden bench", ["bench"]],
    ["Dara gave the passenger a ___.", "thank-you card", ["thank you card"]],
    ["She wrote about the trip when she ___.", "got home", ["went home", "arrived home"]],
  ] satisfies [string, string, string[]?][]).map(([prompt, answer, alternatives]) => ({
    prompt, answer, alternatives, config: { passage: story, example: "Tìm chi tiết trong đoạn truyện rồi điền một đến bốn từ vào câu." },
  })),
  ["for", "did", "who", "but", "to"].map((answer, i) => ({
    prompt: `Write one word for gap ${i + 1}.`, answer,
    config: { passage: letter, example: "Đọc cả lá thư trước khi tự nghĩ ra một từ cho mỗi ô." },
  })),
  [{ prompt: "Write a story of at least 20 words using all three pictures.",
    config: { open: true, visuals: [1, 2, 3].map(i => picture(`write-${i}`)),
      example: "Tìm nhân vật, sự cố và cách giải quyết trong ba tranh. Dùng câu nối để kể theo thứ tự." } }],
];
const writingRubric: Rubric = [
  { title: "Ba khung tranh", description: "Câu chuyện dùng các sự kiện nhìn thấy trong ba khung tranh.", max: 2 },
  { title: "Trình tự và liên kết", description: "Các sự kiện nối tiếp hợp lý. Dùng 0 cho phần bỏ trống.", max: 2 },
  { title: "Diễn đạt dễ hiểu", description: "Bài viết truyền đạt được ý. Xem cả cách dùng từ, câu và hướng dẫn 20 từ.", max: 1 },
];
const speaking: Question[][] = [
  [{
    prompt: "Look at the two pictures of the discovery centre. Describe four differences.",
    config: { visuals: [picture("difference-1"), picture("difference-2")],
      guide: "So sánh vị trí, màu và đồ vật bằng câu đầy đủ. Có thể dùng ‘In Picture A … whereas in Picture B …’.",
      teacher: "Greet the learner. For role-play, ask for an invented first name, surname and age. Ask for four differences. Possible answers: teal versus orange roof, green versus purple coat on the left, notebook versus compass on the right, and binoculars versus lantern on the left." },
  }],
  [{
    prompt: "Find out about two trips. First answer your teacher. Then ask about the other trip.",
    config: { exchange: {
      learner: { value: "Lighthouse walk", image: picture("tour-1") },
      examiner: { value: "Harbour boat trip", image: picture("tour-2") },
      rows: [
        { label: "Day", value: "Tuesday" }, { label: "Start time", value: "11:20 a.m." },
        { label: "Meeting place", value: "By the stone gate" }, { label: "What to bring", value: "A notebook" },
        { label: "Length", value: "45 minutes" },
      ] },
      guide: "Đổi vai sau khi trả lời. Đặt câu hỏi cho cả năm dòng, chẳng hạn ‘What time does it start?’",
      teacher: "First ask the learner about the lighthouse walk: day, start time, meeting place, thing to bring and duration. Then invite them to ask about the Harbour boat trip. Keep this answer sheet on your own screen. It is on Thursday. The boat leaves at 2:10 p.m. Meet outside the ticket office. Bring a water bottle. The trip takes 30 minutes." },
  }],
  [{
    prompt: "Mira's rainy afternoon · Listen to the opening and tell the rest of the story.",
    config: { visuals: [1, 2, 3, 4].map(i => picture(`talk-${i}`)),
      guide: "Nghe giáo viên kể khung đầu. Kể lần lượt ba khung sau và giải thích điều gì xảy ra trước hoặc sau mưa.",
      teacher: "Show all four pictures. Begin: This is Mira. She has brought her compass to the coastal centre. She wants to see the telescope before it gets dark. Ask the learner to continue. In picture 2 it starts raining and Mira gets her raincoat. In picture 3 she meets another visitor and writes notes. In picture 4 they finally see the telescope and have a lantern for the evening. Accept any coherent story that fits the pictures." },
  }],
  [{
    prompt: "Talk with your teacher about your interests, holidays or a day you remember.",
    config: { guide: "Trả lời bằng một hoặc hai câu. Thêm một lý do hoặc một chi tiết về thời gian, nơi chốn.",
      teacher: "Ask some of these questions: What do you like doing on holiday? Which places would you like to visit? Tell me about your last birthday or a special day at school. What would you take on a day trip, and why? Use invented details for demonstrations. Do not ask the learner to enter personal details into the website." },
  }],
];
const papers: Record<StarterPaper, Question[][]> = { listening, reading, speaking };
const rubrics: Partial<Record<StarterPaper, Rubric>> = { reading: writingRubric, speaking: defaultRubric("Speaking") };

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
