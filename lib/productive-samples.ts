import { levels, type Item, type Template } from "./game";
import { defaultRubric, isSpeaking, speakingModes, writingModes, type ProductiveMode } from "./games/productive";

const book = "/illustrations/puzzles/book.webp";
const bag = "/illustrations/puzzles/bag.webp";
const pencil = "/illustrations/puzzles/pencil.webp";
const classroom = "/illustrations/puzzles/classroom.webp";
type Prompt = { prompt: string; hints?: string; example?: string; image?: string; second?: string; stimulus?: string; answer?: string; alternatives?: string[] };
const samples: Record<ProductiveMode, { level: number; title: string; prompts: Prompt[] }> = {
  "speaking-cards": { level: 0, title: "What is in my bag?", prompts: [
    { prompt: "Point to the object. Say what it is.", image: pencil, hints: "a pencil, a pen", example: "This is a pen." },
    { prompt: "Say what you can put inside this.", image: bag, hints: "book, pencil, in" },
  ] },
  "personal-questions": { level: 1, title: "Things I like", prompts: [
    { prompt: "What animal do you like? Say why.", hints: "rabbit, small, quiet", example: "I like cats because they are quiet." },
    { prompt: "What game do you like to play after school?", hints: "football, hide-and-seek, friends" },
  ] },
  "describe-picture": { level: 1, title: "My classroom", prompts: [
    { prompt: "Describe two things you can see in the classroom.", image: classroom, hints: "there is, there are, next to" },
  ] },
  "picture-differences": { level: 2, title: "Two classroom pictures", prompts: [
    { prompt: "Compare the two desks. Find three differences. Talk about what is on, beside or under the desk.",
      image: "/illustrations/practice/4a205265c6d1.webp", second: "/illustrations/practice/81c7415812a5.webp",
      hints: "the first picture, the second picture, beside, under" },
  ] },
  "guided-conversation": { level: 2, title: "After-school club", prompts: [
    { prompt: "Invite a friend to a club. Say when and where you meet.", hints: "Would you like to…?, at four, near the library" },
    { prompt: "Your friend cannot go on Tuesday. Suggest a different time and respond to their reply.", hints: "How about…?, I can, on Thursday" },
  ] },
  storytelling: { level: 3, title: "The lost notebook", prompts: [
    { prompt: "Start a story about a child who notices something is missing at school.", image: classroom, hints: "first, noticed, had left" },
    { prompt: "Continue your story. What does the child find when they open their bag?", image: bag, hints: "when, instead, a clue" },
    { prompt: "Finish your story. Explain where the missing notebook was and how the child feels.", image: book, hints: "finally, relieved, because" },
  ] },
  "complete-word": { level: 0, title: "Finish the classroom words", prompts: [
    { prompt: "Write the whole word. b__k", image: book, answer: "book" },
    { prompt: "Write the whole word. b_g", image: bag, answer: "bag" },
  ] },
  "sentence-building": { level: 1, title: "Build a classroom sentence", prompts: [
    { prompt: "Use these words in a sentence: is / my / this / book.", answer: "This is my book.", alternatives: ["This is my book"] },
    { prompt: "Use these words in a sentence: a / red / have / pen / I.", answer: "I have a red pen.", alternatives: ["I have a red pen"] },
  ] },
  "short-answers": { level: 1, title: "Read and answer", prompts: [
    { prompt: "What colour is the bag? Write one word or a short phrase.", stimulus: "Tom has a red bag and a green pencil.", answer: "red", alternatives: ["It is red", "It is red."] },
  ] },
  "picture-writing": { level: 2, title: "Before the bell", prompts: [
    { prompt: "Write two sentences about the picture. Explain what pupils might do before their lesson starts.", image: classroom, hints: "get ready, put away, before" },
  ] },
  "short-paragraph": { level: 3, title: "An unexpected stop", prompts: [
    { prompt: "Write a short paragraph about how the group changes its plan and why. Give the paragraph an ending.",
      stimulus: "On the way to the coast, the bus breaks down beside a small village.", hints: "although, decided, meanwhile" },
  ] },
  "story-completion": { level: 3, title: "The note in the bag", prompts: [
    { prompt: "Finish the story in a short paragraph. Explain who wrote the note and how the story ends.",
      stimulus: "Aya opened her bag and found a folded note. It said, ‘Meet me by the library after school.’", image: bag, hints: "recognised, discovered, finally" },
  ] },
};

export function productiveSample(mode: ProductiveMode, openAnswer = false) {
  const sample = samples[mode];
  const skill = isSpeaking(mode) ? "Speaking" : "Writing";
  const objective = Boolean(sample.prompts[0].answer && !openAnswer);
  const template: Template = objective ? "type-answer" : "speaking";
  const level = levels[sample.level];
  const items: Item[] = sample.prompts.map(({ prompt, hints, image, second, example, stimulus, answer, alternatives }, index) => ({
    version: 2, prompt, answers: objective && answer ? [answer] : [], options: [], alternatives: objective ? alternatives : undefined,
    english: { skill, level }, media: image ? { image } : undefined,
    practice: { version: 1, mode, maxPlays: 0, reviewedAudio: false, showTranscript: false, stimulus, stimulusImage: second,
      production: { objective, limit: objective ? 100 : sample.level < 2 ? 220 : 600,
        hints, example, preparation: skill === "Speaking" ? 15 : 0, duration: skill === "Speaking" ? 45 : 0,
        ...(index === 0 && !objective ? { rubric: defaultRubric(skill) } : {}) } },
  }));
  return { title: sample.title, level, skill, template, items, label: { ...speakingModes, ...writingModes }[mode] };
}
