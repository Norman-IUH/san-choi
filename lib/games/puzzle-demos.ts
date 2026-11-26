import type { Item } from "./model";
import { pairOptions, type PuzzleTemplate } from "./puzzle-templates";

const picture = (name: string) => "/illustrations/puzzles/" + name + ".webp";
const pair = (prompt: string, answer: string): Item => ({ prompt, answers: [answer], options: [] });

export const puzzleDemos: Record<PuzzleTemplate, { title: string; items: Item[] }> = {
  "labelled-diagram": { title: "Label the classroom shelf", items: [
    { prompt: "What is at the pin?", answers: ["Book"], options: ["Book", "Pencil", "Bag"], pin: { x: 22, y: 42 }, media: { image: picture("classroom") } },
    { prompt: "Name the second object.", answers: ["Bag"], options: ["Book", "Pencil", "Bag"], pin: { x: 77, y: 42 }, media: { image: picture("classroom") } },
  ] },
  "flip-tiles": { title: "Turn over the school words", items: [
    { ...pair("Book", "Quyển sách"), media: { image: picture("book") }, english: { uk: "/audio/vocabulary/book-uk.wav" } },
    { ...pair("Pencil", "Bút chì"), media: { image: picture("pencil") }, english: { us: "/audio/vocabulary/pencil-us.wav" } },
    { ...pair("Bag", "Cặp sách"), media: { image: picture("bag") }, english: { uk: "/audio/vocabulary/bag-uk.wav" } },
  ] },
  "rank-order": { title: "Put the day in order", items: [
    { prompt: "From morning to night", answers: ["Breakfast", "Lunch", "Dinner"], options: [] },
    { prompt: "From early in the week to late", answers: ["Monday", "Wednesday", "Friday"], options: [] },
  ] },
  "pair-or-no-pair": { title: "Words and pictures", items: [
    { prompt: "Book", secondary: "You read it.", answers: ["Pair"], options: [...pairOptions], media: { image: picture("book") } },
    { prompt: "Pencil", secondary: "You wear it.", answers: ["No Pair"], options: [...pairOptions], media: { image: picture("pencil") } },
  ] },
  "image-quiz": { title: "Find it in the picture", items: ["Book", "Bag"].map(answer => ({
    prompt: "Find the " + answer.toLowerCase() + ".", answers: [answer], options: ["Book", "Pencil", "Bag"],
    optionMedia: ["Book", "Pencil", "Bag"].map(option => ({ option, image: picture(option.toLowerCase()) })),
  })) },
  "watch-memorize": { title: "Remember the school words", items: [
    { prompt: "Remember the order.", answers: ["Book", "Pencil", "Bag"], options: [] },
    { prompt: "Remember these days.", answers: ["Tuesday", "Thursday", "Saturday"], options: [] },
  ] },
  "maths-generator": { title: "Numbers in the classroom", items: [
    { prompt: "Add the numbers.", answers: [], options: [], math: { operation: "add", min: 1, max: 9 } },
    { prompt: "Share equally.", answers: [], options: [], math: { operation: "divide", min: 2, max: 6 } },
  ] },
};
