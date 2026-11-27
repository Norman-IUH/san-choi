import { isPhonics, practiceModes, type PracticeMode } from "./games/practice";
import { levels, type Item } from "./game";

type Sample = [prompt: string, answer: string, distractors: string[], clip?: string];
const examples: Record<PracticeMode, Sample> = {
  listen: ["Nghe và chọn đồ vật được nói đến.", "apple", ["book", "ruler"], "aa1000000001"],
  "listen-match": ["Nghe rồi ghép clip với thẻ đúng.", "kite", ["ball", "robot"], "aa1000000002"],
  colour: ["Nghe rồi tô màu quyển sách.", "blue", ["red", "green"], "aa1000000003"],
  dictation: ["Nghe và viết cả câu.", "I have two red cups.", [], "aa1000000004"],
  dialogue: ["Eli muốn ăn món gì vào buổi trưa?", "A cheese sandwich", ["Soup", "A banana"], "aa1000000005"],
  "letter-sounds": ["Nghe âm, rồi chọn chữ biểu thị âm đó.", "m", ["s", "t"]],
  beginning: ["Nghe âm đầu rồi chọn từ bắt đầu bằng âm đó.", "sun", ["hat", "dog"]],
  ending: ["Nghe âm cuối rồi chọn từ kết thúc bằng âm đó.", "cat", ["dog", "fish"]],
  blending: ["Nghe các âm tách rời rồi chọn từ khi ghép lại.", "cat", ["cap", "cup"]],
  rhymes: ["Nghe từ rồi chọn từ có vần giống nhau.", "hat", ["dog", "fish"]],
  discrimination: ["Nghe từ được đọc rồi chọn thẻ em nghe thấy.", "ship", ["sheep", "shop"]],
};

export function practiceSample(mode: PracticeMode) {
  const [prompt, answer, distractors, clip] = examples[mode];
  const phonics = isPhonics(mode);
  const item: Item = {
    version: 2, prompt, answers: [answer], options: distractors.length ? [answer, ...distractors] : [],
    ...(mode === "dictation" ? { alternatives: ["I have two red cups"] } : {}),
    english: { level: mode === "dialogue" ? levels[2] : levels[0], skill: phonics ? "Phonics" : "Listening" },
    media: { audio: clip ? `/audio/practice/${clip}.wav` : undefined, image: mode === "colour" ? "/illustrations/practice/book.png" : undefined },
    practice: {
      version: 1, mode, maxPlays: 0, showTranscript: false, reviewedAudio: false,
      ...(mode === "dialogue" ? { transcript: "Mia: What do you want for lunch, Eli? Eli: A cheese sandwich, please. Mia: Would you like some water? Eli: Yes, please." } : {}),
    },
  };
  return { title: practiceModes[mode], item };
}
