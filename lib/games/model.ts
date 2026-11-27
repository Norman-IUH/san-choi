import { z } from "zod";
import { difficultyLevels } from "./arcade-templates";
import { mathOperations } from "./puzzle-templates";
import type { WordSlot } from "./word-puzzles";
import { practiceSchema, samplePracticeAudio, type publicPractice } from "./practice";
import { starterAudio, starterImage } from "./starters";

const text = z.string().trim().min(1).max(400);
export const levels = ["Kids", "Pre A1 Starters", "A1 Movers", "A2 Flyers"] as const;
export const skills = ["Vocabulary", "Phonics", "Listening", "Speaking", "Reading", "Writing", "Grammar"] as const;
export const mediaPath = z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp|mp3|wav|ogg)$/);
const imagePath = mediaPath.refine(path => /\.(png|jpg|webp)$/.test(path));
const audioPath = mediaPath.refine(path => /\.(mp3|wav|ogg)$/.test(path));
export const sampleAudioPath = z.string().regex(/^\/audio\/vocabulary\/[a-z]+-(uk|us)\.wav$/);
export const sampleImagePath = z.string().regex(/^\/illustrations\/(puzzles\/(classroom|book|pencil|bag)\.webp|practice\/(book\.png|[a-f0-9]{12}\.webp))$/);
const mediaSchema = z.object({ image: z.union([imagePath, sampleImagePath, starterImage]).optional(), audio: z.union([audioPath, samplePracticeAudio, starterAudio]).optional() });
const englishSchema = z.object({
  level: z.enum(levels).optional(),
  skill: z.enum(skills).optional(),
  meaning: text.optional(),
  ipa: z.string().trim().min(1).max(100).optional(),
  example: text.optional(),
  uk: z.union([audioPath, sampleAudioPath]).optional(),
  us: z.union([audioPath, sampleAudioPath]).optional(),
});
export const itemSchema = z.object({
  version: z.literal(2).optional(),
  prompt: text,
  answers: z.array(text).max(16),
  options: z.array(text).max(8).default([]),
  english: englishSchema.optional(),
  media: mediaSchema.optional(),
  optionMedia: z.array(z.object({ option: text, ...mediaSchema.shape })).max(8).optional(),
  explanation: z.string().trim().min(1).max(800).optional(),
  alternatives: z.array(text).max(8).optional(),
  secondary: text.optional(),
  pin: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).optional(),
  arcade: z.object({ difficulty: z.enum(difficultyLevels), timed: z.boolean() }).optional(),
  math: z.object({ operation: z.enum(mathOperations), min: z.number().int().min(0).max(30),
    max: z.number().int().min(0).max(30) }).optional(),
  practice: practiceSchema.optional(),
});
export type Item = z.infer<typeof itemSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type PlayItem = {
  prompt: string; options: string[]; multiple?: boolean;
  secondary?: string; pin?: Item["pin"]; memory?: string[]; reveal?: string;
  equation?: { left: number; right: number; symbol: string };
  arcade?: Item["arcade"];
  hangman?: { pattern: string[]; misses: number; guesses: string[] };
  letters?: number; grid?: { size: number; letters: string[] }; slot?: WordSlot;
  media?: Media; optionMedia?: Item["optionMedia"]; pronunciation?: Pick<NonNullable<Item["english"]>, "uk" | "us">;
  vocabulary?: Pick<NonNullable<Item["english"]>, "ipa" | "example">;
  practice?: ReturnType<typeof publicPractice>;
};
export function normalize(value: string) {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");
}
