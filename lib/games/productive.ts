import { z } from "zod";

export const speakingModes = {
  "personal-questions": "Personal Questions", "describe-picture": "Describe the Picture",
  "picture-differences": "Picture Differences", storytelling: "Storytelling",
  "speaking-cards": "Speaking Cards", "guided-conversation": "Guided Conversation",
} as const;
export const writingModes = {
  "complete-word": "Complete the Word", "sentence-building": "Sentence Building", "picture-writing": "Picture-based Writing",
  "short-answers": "Short Answers", "short-paragraph": "Short Paragraph", "story-completion": "Story Completion",
} as const;
export type ProductiveMode = keyof typeof speakingModes | keyof typeof writingModes;
export const isSpeaking = (mode: string): mode is keyof typeof speakingModes => Object.hasOwn(speakingModes, mode);
export const isWriting = (mode: string): mode is keyof typeof writingModes => Object.hasOwn(writingModes, mode);
export const isProductive = (mode: string): mode is ProductiveMode => isSpeaking(mode) || isWriting(mode);
export const rubricSchema = z.array(z.object({
  title: z.string().trim().min(1).max(60), description: z.string().trim().max(240), max: z.number().int().min(1).max(20),
})).min(1).max(8).refine(rows => new Set(rows.map(row => row.title.toLowerCase())).size === rows.length, "Mỗi tiêu chí rubric cần tên riêng.");
export type Rubric = z.infer<typeof rubricSchema>;
export type ManualReview = { state: "pending" | "reviewed" | "published"; scores: (number | null)[];
  total: number | null; feedback: string; revision: number; published_at: string | null };
export const assessmentSchema = z.object({
  version: z.literal(1), skill: z.enum(["Speaking", "Writing"]), level: z.string().max(40), rubric: rubricSchema,
});

export const productionSchema = z.object({
  limit: z.number().int().min(1).max(1200).default(240), objective: z.boolean().default(false),
  hints: z.string().trim().min(1).max(300).optional(), example: z.string().trim().min(1).max(400).optional(),
  preparation: z.number().int().min(0).max(120).default(0), duration: z.number().int().min(0).max(90).default(0),
  rubric: rubricSchema.optional(),
});

export function defaultRubric(skill: "Speaking" | "Writing"): Rubric {
  return [
    { title: "Vocabulary", description: "Uses words that fit the task and make the meaning clear.", max: 4 },
    { title: "Grammar", description: "Uses sentence patterns that convey the intended meaning.", max: 4 },
    ...(skill === "Speaking" ? [
      { title: "Fluency", description: "Keeps going and links ideas at a comfortable pace.", max: 4 },
      { title: "Pronunciation", description: "Can be understood when speaking.", max: 4 },
    ] : [
      { title: "Spelling", description: "Spells familiar words so the reader can understand them.", max: 4 },
      { title: "Organization", description: "Presents ideas in an order the reader can follow.", max: 4 },
    ]),
    { title: "Task completion", description: "Responds to the main parts of the prompt.", max: 4 },
  ];
}

export function reviewScores(rubric: Rubric, submitted: FormData, publish: boolean) {
  const scores = rubric.map((row, index) => {
    const raw = submitted.get(`criterion-${index}`);
    if (raw === null || raw === "") return null;
    return typeof raw === "string" && /^\d{1,2}$/.test(raw) && Number(raw) <= row.max ? Number(raw) : NaN;
  });
  if (scores.some(Number.isNaN) || (publish && scores.some(score => score === null))) return null;
  return { scores, total: scores.every(score => score !== null) ? scores.reduce<number>((sum, score) => sum + (score ?? 0), 0) : null,
    maximum: rubric.reduce((sum, row) => sum + row.max, 0) };
}
