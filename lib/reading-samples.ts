import { levels, type Item } from "./game";
import { readingModes, practiceTemplate, type ReadingMode } from "./games/practice";

export const readingSamples = {
  "picture-reading": {
    level: levels[0], title: "The classroom picture", kind: "picture", image: "/illustrations/puzzles/classroom.webp", text: "Look at the classroom. Read each question.",
    rows: [["Which object is for writing?", "Pencil", "Bag", "Book"], ["Which object can hold your things?", "Bag", "Pencil", "Book"]],
  },
  "sentence-matching": {
    level: levels[1], title: "Pets at home", kind: "dialogue", text: "Ben: My kitten sleeps in a basket.\nMaya: My parrot sits by the window.\nBen: My fish swims in a small tank.",
    rows: [["The kitten", "sleeps in a basket."], ["The parrot", "sits by the window."], ["The fish", "swims in a small tank."]],
  },
  "passage-reading": {
    level: levels[2], title: "A busy morning", kind: "passage", text: "On Tuesdays, Lila feeds her rabbit before breakfast. She usually walks to school with Tess. Yesterday it rained, so they caught the bus. They arrived just before the bell.",
    rows: [["What does Lila do before breakfast?", "She feeds her rabbit.", "She catches the bus.", "She walks to school."], ["Why did the girls take the bus?", "It rained.", "They missed the bell.", "They had no breakfast."]],
  },
  "story-sequencing": {
    level: levels[3], title: "A map in the rain", kind: "story", text: "Before the walk, Noor put the map in a dry bag. At the first bend, rain started. The group waited under a shelter. When the sky cleared, Noor took out the map and led them back to the hostel.",
    rows: [["Put the events in story order.", "Noor packed the map.", "It started to rain.", "The group found shelter.", "Noor led them back."]],
  },
  "gap-reading": {
    level: levels[1], title: "At the animal shelter", kind: "instructions", text: "Fill the puppy's bowl with clean water. Then put a blanket in the kitten's basket. Wash your hands before you go home.",
    rows: [["Put a ___ in the kitten's basket.", "blanket"], ["Fill the puppy's bowl with clean ___ .", "water"]],
  },
  "reading-choice": {
    level: levels[3], title: "A change of plans", kind: "passage", text: "We planned to sail to the island at nine, but the wind was too strong. Our guide suggested visiting a lighthouse on foot. By lunchtime the sea was calm enough for the ferry to leave.",
    rows: [["What did the guide suggest doing first?", "Walking to a lighthouse", "Sailing at nine", "Having lunch on the island"], ["What changed by lunchtime?", "The sea became calmer.", "The wind got stronger.", "The lighthouse closed."]],
  },
} as const;

export function readingSample(mode: ReadingMode) {
  const source = readingSamples[mode];
  const template = practiceTemplate(mode);
  const items: Item[] = source.rows.map(([prompt, ...choices], index) => ({
    version: 2, prompt, answers: template === "unjumble" ? choices : [choices[0]],
    options: template === "quiz" ? choices : [],
    english: { level: source.level, skill: "Reading" },
    practice: { version: 1, mode, maxPlays: 0, showTranscript: false, reviewedAudio: false,
      ...(index === 0 && { stimulusKind: source.kind, stimulus: source.text, stimulusImage: "image" in source ? source.image : undefined }) },
  }));
  return { title: source.title, modeTitle: readingModes[mode], template, level: source.level, items } as const;
}
