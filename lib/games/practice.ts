import { z } from "zod";

export const practiceModes = {
  listen: "Listen and Choose", "listen-match": "Listen and Match", colour: "Listen and Colour",
  dictation: "Dictation", dialogue: "Dialogue Comprehension",
  "letter-sounds": "Letter Sounds", beginning: "Beginning Sounds", ending: "Ending Sounds",
  blending: "Blending", rhymes: "Rhyming Words", discrimination: "Sound Discrimination",
} as const;
export type PracticeMode = keyof typeof practiceModes;
export const practiceModeSchema = z.enum(Object.keys(practiceModes) as PracticeMode[]);
export const practiceSchema = z.object({
  version: z.literal(1),
  mode: practiceModeSchema,
  maxPlays: z.number().int().min(0).max(10).default(0),
  stimulus: z.string().trim().min(1).max(1000).optional(),
  transcript: z.string().trim().min(1).max(1000).optional(),
  showTranscript: z.boolean().default(false),
  reviewedAudio: z.boolean().default(false),
  pictureChoices: z.boolean().optional(),
  regions: z.array(z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100),
    width: z.number().min(1).max(100).default(15), height: z.number().min(1).max(100).default(15) })).min(2).max(8).optional(),
  correctRegion: z.number().int().min(1).max(8).optional(),
});
export type Practice = z.infer<typeof practiceSchema>;

export const isPhonics = (mode: PracticeMode) =>
  mode === "letter-sounds" || mode === "beginning" || mode === "ending" ||
  mode === "blending" || mode === "rhymes" || mode === "discrimination";
export const practiceTemplate = (mode: PracticeMode) => mode === "dictation" ? "type-answer" : "quiz";
export const samplePracticeAudio = z.string().regex(/^\/audio\/practice\/[a-f0-9]{12}\.wav$/);
export const colourPalette: Record<string, string> = {
  red: "#bd383c", blue: "#2859bd", green: "#207449", yellow: "#f2c945", orange: "#d36524",
  pink: "#e685a9", purple: "#7546a0", brown: "#85513d", black: "#202333", white: "#fff", grey: "#8b929e",
};

export function publicPractice(practice: Practice) {
  const { version, mode, maxPlays, stimulus, transcript, showTranscript, pictureChoices, regions } = practice;
  return { version, mode, maxPlays, stimulus, pictureChoices, regions, transcript: showTranscript && mode === "dialogue" ? transcript : undefined };
}

export const pictureToken = (index: number) => `image-${index + 1}`;
