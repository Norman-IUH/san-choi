import { type ArcadeTemplate } from "./arcade-templates";
import type { Item } from "./model";

const choose = (prompt: string, options: string[], answer: string, word?: string): Item => ({
  prompt, options, answers: [answer], ...(word && { english: { uk: "/audio/vocabulary/" + word + "-uk.wav",
    us: "/audio/vocabulary/" + word + "-us.wav" } }),
});
export const arcadeDemos: Record<ArcadeTemplate, { title: string; items: Item[] }> = {
  "maze-chase": { title: "Trail of Hidden Words", items: [
    choose("You read it. What is it?", ["Book", "Bag", "Ruler"], "Book", "book"),
    choose("It quacks near the pond.", ["Horse", "Duck", "Goat"], "Duck", "duck"),
  ] },
  "flying-fruit": { title: "Harvest in the Air", items: [
    choose("Which animal lives on a farm?", ["Horse", "Shark", "Penguin"], "Horse", "horse"),
    choose("Find the word that means very small.", ["Tall", "Tiny", "Wide"], "Tiny"),
  ] },
  airplane: { title: "Cloud Post Express", items: [
    choose("Which word means the opposite of left?", ["Right", "Under", "Behind"], "Right"),
    choose("Which tool helps you measure a line?", ["Eraser", "Pencil", "Ruler"], "Ruler", "ruler"),
  ] },
};
