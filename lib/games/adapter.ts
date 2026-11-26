import { templates, type Template } from "./registry";
import { buildCrossword, makeWordsearch } from "./word-puzzles";
import { normalize, type Item, type PlayItem } from "./model";

export function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function makePlayItems(template: Template, items: Item[]): PlayItem[] {
  const kind = templates[template].kind;
  const pairOptions = kind === "pair" && template !== "flash-cards"
    ? shuffle([...new Set(items.map(item => item.answers[0]))]) : [];
  const crossword = template === "crossword" ? buildCrossword(items.map(item => item.answers[0] ?? "")) : null;
  return items.map((item, index) => ({
    ...(crossword && { slot: crossword.slots[index] }),
    ...((template === "spell-word" || template === "hangman") && { letters: item.answers[0]?.length }),
    ...(template === "wordsearch" && (() => {
      const { grid, size } = makeWordsearch(item.answers[0], index);
      return { grid: { size, letters: grid } };
    })()),
    prompt: template === "open-box" ? "" : item.prompt,
    media: item.media,
    optionMedia: item.optionMedia?.map(entry => ({
      ...entry, option: item.options.find(option => normalize(option) === normalize(entry.option)) ?? entry.option,
    })),
    pronunciation: item.english ? { uk: item.english.uk, us: item.english.us } : undefined,
    vocabulary: template === "flash-cards" && item.english ? { ipa: item.english.ipa, example: item.english.example } : undefined,
    ...(kind === "choice" && { multiple: item.answers.length > 1 }),
    options: kind === "choice" ? shuffle(item.options) :
      kind === "sequence" ? shuffle(item.answers) :
      kind === "word" ? shuffle(Array.from(item.answers[0].normalize("NFC"))) : pairOptions,
  }));
}
