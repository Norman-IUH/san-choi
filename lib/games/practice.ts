import { z } from "zod";
import { productionSchema, speakingModes, writingModes } from "./productive";
import { starterConfig, starterProjection } from "./starters";

export const listeningModes = {
  listen: "Listen and Choose", "listen-match": "Listen and Match", colour: "Listen and Colour",
  dictation: "Dictation", dialogue: "Dialogue Comprehension",
  "letter-sounds": "Letter Sounds", beginning: "Beginning Sounds", ending: "Ending Sounds",
  blending: "Blending", rhymes: "Rhyming Words", discrimination: "Sound Discrimination",
} as const;
export const readingModes = {
  "sentence-matching": "Sentence Matching", "picture-reading": "Picture Comprehension",
  "passage-reading": "Short Passage Comprehension", "story-sequencing": "Story Sequencing",
  "gap-reading": "Gap Filling", "reading-choice": "Multiple Choice",
} as const;
export const practiceModes = { ...listeningModes, ...readingModes, ...speakingModes, ...writingModes, grammar: "Grammar Practice", starters: "Pre A1 Starters" };
export type PracticeMode = keyof typeof practiceModes;
export type AudioPracticeMode = keyof typeof listeningModes;
export type ReadingMode = keyof typeof readingModes;
export const practiceModeSchema = z.enum(Object.keys(practiceModes) as PracticeMode[]);
export const practiceSchema = z.object({
  version: z.literal(1),
  mode: practiceModeSchema,
  maxPlays: z.number().int().min(0).max(10).default(0),
  stimulus: z.string().trim().min(1).max(3000).optional(),
  stimulusKind: z.enum(["passage", "picture", "story", "dialogue", "instructions"]).optional(),
  stimulusImage: z.string().regex(/^(?:[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:png|jpg|webp)|\/illustrations\/(?:puzzles\/(?:classroom|book|pencil|bag)|practice\/[a-f0-9]{12})\.webp)$/).optional(),
  transcript: z.string().trim().min(1).max(1000).optional(),
  showTranscript: z.boolean().default(false),
  reviewedAudio: z.boolean().default(false),
  pictureChoices: z.boolean().optional(),
  regions: z.array(z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100),
    width: z.number().min(1).max(100).default(15), height: z.number().min(1).max(100).default(15) })).min(2).max(8).optional(),
  correctRegion: z.number().int().min(1).max(8).optional(),
  production: productionSchema.optional(),
  starters: starterConfig.optional(),
});
export type Practice = z.infer<typeof practiceSchema>;

export const isPhonics = (mode: PracticeMode) =>
  mode === "letter-sounds" || mode === "beginning" || mode === "ending" ||
  mode === "blending" || mode === "rhymes" || mode === "discrimination";
export const isReading = (mode: PracticeMode): mode is ReadingMode => Object.hasOwn(readingModes, mode);
export const isAudioPractice = (mode: PracticeMode): mode is AudioPracticeMode => Object.hasOwn(listeningModes, mode);
export const grammarTemplates = ["quiz", "sentence", "type-answer", "unjumble", "word-magnets"] as const;
export function practiceTemplate(mode: PracticeMode): "type-answer" | "match-up" | "unjumble" | "sentence" | "quiz" {
  switch (mode) {
    case "dictation": return "type-answer";
    case "sentence-matching": return "match-up";
    case "story-sequencing": return "unjumble";
    case "gap-reading": return "sentence";
    default: return "quiz";
  }
}
export const samplePracticeAudio = z.string().regex(/^\/audio\/practice\/[a-f0-9]{12}\.wav$/);
export const colourPalette: Record<string, string> = {
  red: "#bd383c", blue: "#2859bd", green: "#207449", yellow: "#f2c945", orange: "#d36524",
  pink: "#e685a9", purple: "#7546a0", brown: "#85513d", black: "#202333", white: "#fff", grey: "#8b929e",
};

export function publicPractice(practice: Practice) {
  const { version, mode, maxPlays, stimulus, stimulusKind, stimulusImage, transcript, showTranscript, pictureChoices, regions, production } = practice;
  return { version, mode, maxPlays, stimulus, stimulusKind, stimulusImage, pictureChoices, regions,
    starters: practice.starters && starterProjection(practice.starters),
    production: production && { limit: production.limit, objective: production.objective, hints: production.hints,
      example: production.example, preparation: production.preparation, duration: production.duration },
    transcript: showTranscript && mode === "dialogue" ? transcript : undefined };
}

export const pictureToken = (index: number) => `image-${index + 1}`;
