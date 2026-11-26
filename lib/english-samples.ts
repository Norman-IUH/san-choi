import type { Item } from "./game";
import { levels } from "./game";

export const englishDecks = {
  kids: { level: levels[0], title: "Things in my bag", entries: [
    ["book", "quyển sách", "/bʊk/", "This is my book."],
    ["pen", "bút mực", "/pen/", "I have a blue pen."],
    ["ruler", "thước kẻ", "/ˈruːlə/", "My ruler is long."],
    ["pencil", "bút chì", "/ˈpensəl/", "I draw with a pencil."],
    ["eraser", "cục tẩy", "/ɪˈreɪzə/", "Here is my eraser."],
  ] },
  starters: { level: levels[1], title: "On the farm", entries: [
    ["duck", "con vịt", "/dʌk/", "The duck is in the water."],
    ["goat", "con dê", "/ɡəʊt/", "The goat is eating grass."],
    ["horse", "con ngựa", "/hɔːs/", "The horse is next to the tree."],
    ["sheep", "con cừu", "/ʃiːp/", "The sheep is under the tree."],
    ["cow", "con bò", "/kaʊ/", "The cow is beside the gate."],
  ] },
  movers: { level: levels[2], title: "Finding our way", entries: [
    ["bridge", "cây cầu", "/brɪdʒ/", "We walked across the bridge."],
    ["corner", "góc đường", "/ˈkɔːnə/", "Turn left at the next corner."],
    ["opposite", "đối diện", "/ˈɒpəzɪt/", "The park is opposite the library."],
    ["straight", "thẳng", "/streɪt/", "Walk straight to the school."],
    ["cross", "băng qua", "/krɒs/", "Cross the road at the lights."],
  ] },
  flyers: { level: levels[3], title: "Our school garden", entries: [
    ["protect", "bảo vệ", "/prəˈtekt/", "We planted flowers to protect the bees."],
    ["collect", "thu gom", "/kəˈlekt/", "The class collected rainwater for the garden."],
    ["improve", "cải thiện", "/ɪmˈpruːv/", "The new path improved access to the garden."],
    ["recycle", "tái chế", "/ˌriːˈsaɪkəl/", "We recycle bottles to make small plant pots."],
    ["pollution", "sự ô nhiễm", "/pəˈluːʃən/", "Fewer car trips can reduce air pollution."],
  ] },
} as const;

export type DeckId = keyof typeof englishDecks;
export const deckIds = Object.keys(englishDecks) as DeckId[];
export function isDeckId(id: string): id is DeckId { return Object.hasOwn(englishDecks, id); }

export function englishDeckContent(id: DeckId): Item[] {
  const deck = englishDecks[id];
  return deck.entries.map(([prompt, meaning, ipa, example]) => ({
    version: 2, prompt, answers: [meaning], options: [],
    english: { level: deck.level, skill: "Vocabulary", meaning, ipa, example,
      uk: `/audio/vocabulary/${prompt}-uk.wav`, us: `/audio/vocabulary/${prompt}-us.wav` },
  }));
}
