import { deckIds, englishDecks, type DeckId } from "./english-samples";
import type { Item } from "./game";
import type { grammarTemplates } from "./games/practice";

type Template = typeof grammarTemplates[number];
type Example = [id: string, title: string, template: Template, example: string, prompt: string,
  responses: string[], explanation: string];

const groups: Record<DeckId, Example[]> = {
  kids: [
    ["this-that", "This and that", "quiz", "This pencil is in my hand.", "Point to a bag across the room. Which sentence fits?", ["That is my bag.", "This is my bag."], "Dùng ‘that’ khi chỉ một vật ở xa người nói."],
    ["colours-numbers", "Colours and numbers", "word-magnets", "I see three blue pens.", "Say you can see two red books. Put the words in order.", ["I see", "two", "red", "books"], "Số đứng trước màu. Danh từ ở cuối cụm."],
    ["simple-patterns", "Simple sentence patterns", "unjumble", "This is my chair.", "Make a sentence about a ruler you have.", ["I", "have", "a ruler."], "Mẫu ‘I have’ dùng để nói mình có gì."],
  ],
  starters: [
    ["articles", "A and an", "sentence", "I can see an egg.", "Maya has ___ orange in her lunch box.", ["an"], "Dùng ‘an’ trước âm nguyên âm đầu của ‘orange’."],
    ["plural", "Singular and plural", "sentence", "One book, two books.", "There are three ___ (box) under the table.", ["boxes"], "Thêm ‘-es’ vào ‘box’ để tạo số nhiều."],
    ["pronouns", "Personal pronouns", "quiz", "Ali and I are friends. We play together.", "Mina and Leo have a puppy. ___ play with it after school.", ["They", "He", "We"], "Hai người được nhắc tới dùng đại từ ‘they’."],
    ["have-got", "Have got", "type-answer", "She's got a blue bike.", "Rewrite ‘Leo has a kitten’ with ‘got’. Do not add a full stop.", ["Leo has got a kitten", "Leo's got a kitten", "Leo’s got a kitten"], "‘Has got’ có thể rút gọn thành ‘'s got’."],
    ["can-cant", "Can and can’t", "type-answer", "My dog can swim.", "Say that the kitten is unable to fly. Begin with ‘The kitten’. Do not add a full stop.", ["The kitten can't fly", "The kitten cannot fly", "The kitten can’t fly"], "‘Cannot’ và ‘can’t’ cùng diễn tả không thể làm việc gì."],
    ["prepositions", "Basic prepositions", "quiz", "The fish is in the tank.", "The cat is below the sofa seat, on the floor. The cat is ___ the sofa.", ["under", "on", "in"], "‘Under’ diễn tả vị trí ở bên dưới."],
  ],
  movers: [
    ["present-simple", "Present Simple", "sentence", "I walk to school every day.", "Every morning, Tess ___ (feed) her rabbit.", ["feeds"], "Thêm ‘-s’ với chủ ngữ ngôi thứ ba số ít trong hiện tại đơn."],
    ["present-continuous", "Present Continuous", "type-answer", "I am washing the dishes now.", "Complete ‘She ___ now’ with the verb ‘read’. Type the full sentence without a full stop.", ["She is reading now", "She's reading now", "She’s reading now"], "Dùng ‘is’ và động từ thêm ‘-ing’ để nói việc đang diễn ra."],
    ["past-simple", "Past Simple", "sentence", "Last night we watched a film.", "Yesterday Ben ___ (go) to the park.", ["went"], "‘Go’ có dạng quá khứ bất quy tắc là ‘went’."],
    ["comparatives", "Comparatives", "sentence", "This path is shorter than that one.", "The bus is ___ (fast) than my bike.", ["faster"], "Với ‘fast’, thêm ‘-er’ rồi dùng ‘than’ để so sánh."],
    ["question-forms", "Question forms", "unjumble", "Where do you play after school?", "Ask when her lesson starts.", ["When", "does", "her lesson", "start?"], "Sau ‘does’, dùng nguyên mẫu ‘start’."],
    ["frequency", "Frequency adverbs", "quiz", "I often read before bed.", "Choose the usual position of ‘always’ with ‘be’.", ["I am always ready at eight.", "I always am ready at eight.", "I am ready always at eight."], "Trong mẫu thông thường, ‘always’ đứng sau ‘am’, ‘is’ hoặc ‘are’."],
  ],
  flyers: [
    ["past-continuous", "Past Continuous", "sentence", "We were walking when the rain began.", "Complete with ‘pack’ as an ongoing action. Noor ___ her bag when the phone rang.", ["was packing"], "Dùng ‘was packing’ cho hành động đang diễn ra tại thời điểm có sự kiện khác."],
    ["future", "Future forms", "type-answer", "Look at those clouds. It is going to rain.", "Use ‘going to’ to say that we plan to visit the island. End with ‘the island’ and omit the full stop.", ["We are going to visit the island", "We're going to visit the island", "We’re going to visit the island"], "‘Be going to’ diễn tả kế hoạch đã có."],
    ["superlatives", "Superlatives", "sentence", "That was the longest walk of the week.", "This is the ___ (high) hill on the island.", ["highest"], "Dùng ‘the’ và ‘-est’ để so sánh nhất với ‘high’."],
    ["conjunctions", "Conjunctions", "quiz", "We took the bus because it was raining.", "The wind was strong, ___ we stayed in the harbour. Choose the word that shows the result.", ["so", "because", "but"], "‘So’ giới thiệu kết quả của việc gió mạnh."],
    ["modals", "Modal verbs", "quiz", "You should bring a jacket if it is cold.", "Give friendly advice, with no rule or obligation. ‘You ___ take a map on that walk.’", ["should", "must", "can't"], "‘Should’ phù hợp khi đưa ra lời khuyên."],
    ["relative-clauses", "Relative clauses", "word-magnets", "The guide who met us spoke English.", "Describe the friend who lost her map. Put the words in order.", ["My friend", "who lost her map", "asked for help."], "Mệnh đề với ‘who’ đứng sau người được mô tả."],
  ],
};

export const grammarTopics = deckIds.flatMap(id => groups[id].map(([key, title]) => ({ key, title, level: englishDecks[id].level })));

export function grammarSample(key: string) {
  const topic = grammarTopics.find(topic => topic.key === key);
  if (!topic) return null;
  const [, , template, stimulus, prompt, responses, explanation] = Object.values(groups).flat().find(row => row[0] === key)!;
  const ordered = template === "word-magnets" || template === "unjumble";
  const typed = template === "sentence" || template === "type-answer";
  const items: Item[] = [{ version: 2, prompt, explanation, answers: ordered ? responses : [responses[0]],
    options: template === "quiz" ? responses : [], ...(typed && responses.length > 1 && { alternatives: responses.slice(1) }),
    english: { level: topic.level, skill: "Grammar" },
    practice: { version: 1, mode: "grammar", maxPlays: 0, reviewedAudio: false, showTranscript: false, stimulus },
  }];
  return { ...topic, template, items };
}
