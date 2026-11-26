import { templates, type Template } from "./registry";
import { normalize, type Item } from "./model";

export const doubleMarker = "★ nhân đôi";
export type ReviewEntry = { prompt: string; selected: string[]; expected: string[]; explanation?: string };

export function missedReview(items: Item[], submitted: { answer: string[]; correct: boolean | null }[]): ReviewEntry[] {
  return submitted.flatMap(({ answer, correct }, index) => {
    const item = items[index];
    return item && correct === false ? [{ prompt: item.prompt, selected: answer.filter(value => value !== doubleMarker),
      expected: [...item.answers, ...(item.alternatives ?? [])], explanation: item.explanation }] : [];
  });
}

export function grade(template: Template, items: Item[], responses: string[][]) {
  const kind = templates[template].kind;
  const doubleIndex = template === "gameshow" ? responses.findIndex(response => response.at(-1) === doubleMarker) : -1;
  const correct = items.map((item, index) => {
    if (kind === "prompt" || template === "flash-cards") return null;
    const expected = item.answers.map(normalize);
    const response = responses[index] ?? [];
    const actual = (index === doubleIndex ? response.slice(0, -1) : response).map(normalize);
    if (kind === "word") return actual.join("") === expected[0];
    if (template === "wordsearch" && actual.length === 1) return actual[0] === expected[0] || Array.from(actual[0]).reverse().join("") === expected[0];
    if ((kind === "blank" || template === "type-answer") && actual.length === 1) return [...expected, ...(item.alternatives ?? []).map(normalize)].includes(actual[0]);
    if (kind === "choice") {
      expected.sort();
      actual.sort();
    }
    return expected.length === actual.length && expected.every((answer, position) => answer === actual[position]);
  });
  return { correct, score: correct.every(value => value === null) ? null : correct.filter(Boolean).length + Number(correct[doubleIndex] === true),
    total: correct.filter(value => value !== null).length + Number(doubleIndex >= 0 && doubleIndex < items.length) };
}
