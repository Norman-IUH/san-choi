import { levels, type Item, type Template } from "./game";
import { vocabularyCatalog } from "./vocabulary-catalog";
import { vocabularyGame, type VocabularyLesson } from "./vocabulary-bank";
import { grammarSample } from "./grammar-samples";
import { readingSample } from "./reading-samples";
import { productiveSample } from "./productive-samples";
import type { ProductiveMode } from "./games/productive";
type LessonActivity = { title: string; template: Template; items: Item[] };

const basePlans = {
  classroom: { title: "Colours and Classroom Objects", level: levels[0], topic: "Classroom objects", words: ["book", "pencil", "ruler", "red", "blue"],
    objectives: "Name three classroom objects. Describe an object using a colour and a simple sentence.",
    homework: "Draw two classroom objects and say their names and colours.", reading: "picture-reading", grammar: "colours-numbers", game: "match-up" },
  pets: { title: "Animals and Pets", level: levels[1], topic: "Animals", words: ["kitten", "puppy", "hamster", "parrot", "goldfish"],
    objectives: "Name five pets and match people’s descriptions to their animals. Say what a pet can or can’t do.",
    homework: "Draw a pet. Write one thing it can do and one thing it can’t do.", reading: "sentence-matching", grammar: "can-cant", game: "quiz" },
  routine: { title: "My Daily Routine", level: levels[2], topic: "Daily routines", words: ["wake up", "have breakfast", "catch the bus", "feed the pet", "go to bed"],
    objectives: "Describe a morning routine. Find two details in a short story and use third-person present simple.",
    homework: "Write three sentences about a family member’s routine using time expressions.", reading: "passage-reading", grammar: "present-simple", game: "find-match" },
  travel: { title: "Travel and Adventures", level: levels[3], topic: "Travel", words: ["journey", "timetable", "compass", "trail", "shelter"],
    objectives: "Read a short travel story, put events in order and explain a travel plan.",
    homework: "Write two plans for a trip using ‘going to’. Include one item you will pack.", reading: "story-sequencing", grammar: "future", game: "true-false" },
} as const;

const skillPlans = {
  "classroom-skills": { base: "classroom", title: "Show and Spell", speaking: "speaking-cards", writing: "complete-word",
    objectives: "Name classroom objects aloud and spell two familiar words.", homework: "Label two objects at home and say one sentence about each." },
  "pets-skills": { base: "pets", title: "Pets We Like", speaking: "personal-questions", writing: "sentence-building",
    objectives: "Answer a personal question about a pet and build two short English sentences.", homework: "Describe a pet you like in one sentence." },
  "routine-skills": { base: "routine", title: "Before the Bell", speaking: "picture-differences", writing: "picture-writing",
    objectives: "Compare familiar scenes aloud and write two sentences about a classroom routine.", homework: "Write two things you do before your first lesson." },
  "travel-skills": { base: "travel", title: "The Road to the Coast", speaking: "storytelling", writing: "short-paragraph",
    objectives: "Tell a three-part story and write a short paragraph with a clear ending.", homework: "Read your paragraph aloud and check the sequence of events." },
} as const satisfies Record<string, { base: keyof typeof basePlans; title: string; speaking: ProductiveMode; writing: ProductiveMode; objectives: string; homework: string }>;

export const samplePlans = { ...basePlans, ...Object.fromEntries(Object.entries(skillPlans).map(([key, plan]) =>
  [key, { title: plan.title, level: basePlans[plan.base].level }])) };

export function samplePlan(key: string) {
  const skills = Object.hasOwn(skillPlans, key) ? skillPlans[key as keyof typeof skillPlans] : null;
  const baseKey = skills?.base ?? key;
  if (!Object.hasOwn(basePlans, baseKey)) return null;
  const sample = basePlans[baseKey as keyof typeof basePlans];
  const words = sample.words.flatMap(word => vocabularyCatalog.find(entry => entry.level === sample.level && entry.word === word) ?? []);
  const lesson: VocabularyLesson = { title: skills?.title ?? sample.title, level: sample.level, skill: skills ? "Speaking" : "Vocabulary", topic: sample.topic,
    unit: "Unit 1", difficulty: "gentle", entry_keys: words.map(word => word.id) };
  const reading = readingSample(sample.reading);
  const grammar = grammarSample(sample.grammar)!;
  const activities: LessonActivity[] = [
    { title: "Warm-up", template: "open-box", items: words.map(word => ({ prompt: `Point, draw or act: ${word.word}`, answers: [], options: [] })) },
    { title: "Introduce the words", template: "flash-cards", items: vocabularyGame("flash-cards", words, "Vocabulary", "gentle") ?? [] },
    skills ? productiveSample(skills.speaking) : reading,
    { title: "Vocabulary game", template: sample.game, items: vocabularyGame(sample.game, words, "Vocabulary", "gentle") ?? [] },
    skills ? productiveSample(skills.writing) : grammar,
  ];
  return { lesson, activities, objectives: skills?.objectives ?? sample.objectives, homework: skills?.homework ?? sample.homework };
}

export function sampleStep(source: string) {
  const [key, index] = source.split("/");
  return samplePlan(key)?.activities[Number(index)];
}
