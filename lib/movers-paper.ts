import type { Item, Template } from "./game";
import { cambridgeLevels, moverPartNames, starterPapers, cambridgeCounts, type CambridgePart, type StarterPaper } from "./games/starters";
import { defaultRubric, type Rubric } from "./games/productive";

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

const definitions = cards(["camera", "torch", "helmet", "basket", "map", "clock", "scarf", "drum"]);
const conversation = "Rosa and Max are planning a stall for the school fair.";
const lostBag = "Zara was going to her school fair. Before she left home, she filled a (1) ___ with water. Her little brother drew a (2) ___ so she could find the fair. At the gate, Zara took out her (3) ___ to take a picture. Then she saw a small (4) ___ behind a table. A girl was looking for it. Zara gave it to her. Her new friend shared a (5) ___ with her at lunchtime.";
const rainbows = "Rainbows\n\nOn some days, it rains (1) ___ the sun is still shining. A rainbow can appear (2) ___ the sky when the sunlight goes through drops of rain. It has many colours. The red part is usually (3) ___ the top of the rainbow. A rainbow (4) ___ look like half a circle. You can sometimes see two rainbows, but the second one is often (5) ___ to see.";
const story = [
  { scene: image("story-notice"), passage: "On Saturday, Leo saw a notice outside the old library. It said that the school fair was open. His friend Nina wanted to see the fair too, but she was still at home. Leo took a map and went to meet her." },
  { scene: image("story-find"), passage: "At the fair, Leo and Nina saw a red bag under a bench. They looked inside and found a camera. Nina thought it might belong to someone at the photo stall, so they took the bag there." },
  { scene: image("story-help"), passage: "A woman at the photo stall was looking for her bag. She was very happy when Leo handed it to her. She took a picture of the two friends. Then Leo and Nina went to listen to music." },
];
const reading: Question[][] = [
  [
    ["You wear this on your head when you ride a bike.", "helmet"],
    ["This shows where places are and helps you find your way.", "map"],
    ["You can carry sandwiches or fruit in this.", "basket"],
    ["This helps you see when there is no light.", "torch"],
    ["You wear this around your neck on cold days.", "scarf"],
  ].map(([prompt, answer]) => ({ prompt, answer, config: { cards: definitions, copyWord: true,
    example: "Ví dụ: đọc ‘You use this to take a photo’, chọn tranh máy ảnh và viết camera." } })),
  [
    ["Rosa: What shall we sell at our stall?", ["In the school hall.", "How about lemonade?", "It is five o’clock."], 1],
    ["Rosa: Good idea. Have you got any lemons?", ["Yes, there are six at home.", "No, I don't like the drum.", "Yes, it's raining."], 0],
    ["Rosa: Can you bring them tomorrow?", ["I can see the shop.", "They're next to the basket.", "Of course. I'll put them in my bag."], 2],
    ["Rosa: Who will help us make the drinks?", ["About ten cups.", "My sister can help.", "At half past ten."], 1],
    ["Rosa: Where shall we meet?", ["By the school gate.", "A big jug, please.", "We had fun."], 0],
    ["Rosa: Shall I bring some cups too?", ["I didn't see them.", "They were on the table.", "Yes, please. We need twelve."], 2],
  ].map(row => {
    const [prompt, choices, answer] = row as [string, string[], number];
    return { prompt, answer: choices[answer], config: { passage: conversation, choices, example: "Ví dụ: ‘When does it start?’ có thể đáp lại bằng ‘At ten o’clock.’" } };
  }),
  [
    ...["bottle", "map", "camera", "bag", "sandwich"].map((answer, index) => ({
      prompt: `Write the word for gap ${index + 1}.`, answer, config: { passage: lostBag,
        cards: cards(["bottle", "map", "camera", "bag", "sandwich", "clock", "basket", "torch"]), copyWord: true,
        example: "Ví dụ: ‘I used a ___ to carry all my books.’ Trong khung từ, chọn và viết backpack nếu có." },
    })),
    { prompt: "Choose the best title for the story.", answer: "Zara finds a lost bag",
      config: { passage: lostBag, choices: ["Zara buys a camera", "Zara finds a lost bag", "A trip in the rain"],
        example: "Tiêu đề nên nói về sự việc chính trong cả đoạn." } },
  ],
  [
    [["but", "or", "so"], "but"], [["under", "in", "on"], "in"], [["at", "to", "over"], "at"],
    [["can", "has", "is"], "can"], [["hard", "harder", "hardest"], "harder"],
  ].map((row, index) => {
    const [choices, answer] = row as [string[], string];
    return { prompt: `Choose and copy the word for gap ${index + 1}.`, answer, config: { passage: rainbows, choices, copyWord: true,
      example: "Ví dụ: ‘She ___ read English.’ Trong các từ can, was và has, can đứng được trước read." } };
  }),
  [
    ["Leo saw a notice outside the ___.", "old library", 0, ["library"]],
    ["Nina was still ___ when Leo saw the notice.", "at home", 0, ["home"]],
    ["At the fair, the red bag was under a ___.", "bench", 1],
    ["There was a ___ inside the bag.", "camera", 1],
    ["The children took the bag to the ___.", "photo stall", 1],
    ["The woman took a picture of the ___.", "two friends", 2, ["friends", "two children", "children"]],
    ["After that, Leo and Nina listened to ___.", "music", 2],
  ].map(row => {
    const [prompt, answer, scene, alternatives] = row as [string, string, number, string[]?];
    return { prompt, answer, alternatives, config: { ...story[scene], example: "Đọc đoạn cạnh tranh và dùng một, hai hoặc ba từ để hoàn thành câu." } };
  }),
  [
    { prompt: "The person on the left is wearing a ___ shirt.", answer: "green" },
    { prompt: "There is a ___ on the table. You can take a photo with it.", answer: "camera" },
    { prompt: "How many people can you see?", answer: "two", alternatives: ["2", "two people", "there are two people", "there are two people."] },
    { prompt: "What fruit is next to the basket?", answer: "lemon", alternatives: ["a lemon", "a lemon.", "it is a lemon."] },
    { prompt: "Write one full sentence about a person in the picture.", config: { open: true } },
    { prompt: "Write one full sentence about something beside the stall.", config: { open: true } },
  ].map(question => ({ ...question, config: { scene: image("stall-a"), ...question.config,
    example: "Ví dụ: câu đầy đủ về một tranh khác có thể là ‘The children are walking to school.’" } })),
];
const writingRubric: Rubric = [
  { title: "Part 6, câu 5", description: "Một câu hoàn chỉnh, dễ hiểu và đúng với một người trong tranh. Nếu bỏ trống, cho 0 điểm.", max: 1 },
  { title: "Part 6, câu 6", description: "Một câu hoàn chỉnh, dễ hiểu và đúng với một vật bên cạnh gian hàng. Nếu bỏ trống, cho 0 điểm.", max: 1 },
];
const speaking: Question[][] = [
  [{
    prompt: "Look at both pictures. Tell your teacher four things that are different.",
    config: { visuals: [image("stall-a"), image("stall-b")],
      guide: "Dùng ‘In the first picture …, but in the second picture …’ để mô tả bốn điểm khác nhau.",
      teacher: "Greet the learner and ask for a first name and age as role-play. Ask them to describe four differences between the two stalls. Contrast the roof colour, the shirt of the person on the left, the basket and bag, and the camera and bottle on the table. Give another prompt if the learner needs help getting started." },
  }],
  [{
    prompt: "A surprise at the fair · Listen to the beginning, then tell the rest of Leo's story.",
    config: { visuals: ["story-notice", "story-find", "story-help", "story-celebrate"].map(image),
      guide: "Nghe giáo viên kể khung đầu. Sau đó dùng ‘then’, ‘after that’ và ‘in the end’ để kể ba khung còn lại.",
      teacher: "Show all four pictures. Start: This is Leo. On Saturday he saw a notice about the school fair and decided to go. Now tell me about the other pictures. In picture 2 Leo finds a red bag near the bench. In picture 3 he returns it to the photo stall. In picture 4 he stays for the music. Accept sensible accounts that fit the pictures." },
  }],
  [{
    prompt: "In each set, choose the different picture. Tell your teacher why.",
    config: { groups: [
      ["pear", "lemon", "scarf", "sandwich"], ["rabbit", "umbrella", "bird", "fish"],
      ["skates", "shoe", "helmet", "camera"], ["flower", "torch", "camera", "clock"],
    ].map(group => group.map(image)),
    guide: "Chọn hình khác trong mỗi nhóm rồi giải thích bằng ‘These are all …, but this one …’. Có thể có nhiều cách giải thích hợp lý.",
    teacher: "Ask which picture is different and why, for each of the four sets. Possible groupings: food versus scarf; animals versus umbrella; things you wear versus camera; devices versus flower. Accept a different grouping if the learner explains it clearly." },
  }],
  [{
    prompt: "Talk to your teacher about school, weekends, and things you like doing.",
    config: { guide: "Trả lời trực tiếp bằng một câu ngắn, rồi thêm một chi tiết nếu em có thể.",
      teacher: "Ask: What do you like doing after school? Who do you play with at weekends? What did you do last Saturday? Tell me about a game you enjoy. Use invented names and details for demonstrations. The app does not ask the learner to type personal answers." },
  }],
];
const papers: Record<StarterPaper, Question[][]> = { listening, reading, speaking };
export function moverPaper(paper: StarterPaper, part?: number) {
  const rows = papers[paper];
  const mock = part === undefined;
  if (!rows || (!mock && (!Number.isInteger(part) || !rows[part - 1]))) return null;
  const indices = mock ? rows.map((_, index) => index) : [part - 1];
  const template: Template = paper === "speaking" ? "speaking" : "type-answer";
  const rubric = paper === "speaking" ? defaultRubric("Speaking") : paper === "reading" && (mock || part === 6) ? writingRubric : undefined;
  const items: Item[] = indices.flatMap(index => rows[index].map(({ prompt, answer, alternatives, config, clip }, question) => ({
    version: 2, prompt, answers: answer ? [answer] : [], options: [], alternatives,
    english: { level: cambridgeLevels.movers, skill: paper === "listening" ? "Listening" : paper === "reading" ? "Reading" : "Speaking" },
    media: clip ? { audio: `/audio/movers/${clip}.wav` } : undefined,
    practice: { version: 1, mode: "starters", maxPlays: 0, showTranscript: false, reviewedAudio: false,
      starters: { level: "movers", paper, part: index + 1, mock, ...config },
      ...(rubric && index === indices[0] && question === 0 ? { production: {
        objective: false, limit: 240, preparation: 0, duration: 0, rubric,
      } } : {}),
    },
  })));
  const expected = cambridgeCounts({ level: "movers", paper });
  if (indices.some(index => rows[index].length !== expected[index])) throw new Error("Invalid Movers paper length");
  return { template, items, title: `A1 Movers · ${starterPapers[paper]} · ${mock ? "Mock Test" : `Part ${part}`}`,
    label: mock ? starterPapers[paper] : moverPartNames[paper][part - 1] };
}
