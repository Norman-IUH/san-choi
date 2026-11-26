export type Cell = { row: number; column: number };
export type WordSlot = { cells: Cell[]; across: boolean };
export type CrosswordGrid = { height: number; width: number; slots: WordSlot[] };

export const cellKey = ({ row, column }: Cell) => row + ":" + column;
const step = (start: Cell, offset: number, across: boolean): Cell => ({
  row: start.row + (across ? 0 : offset), column: start.column + (across ? offset : 0),
});

export function buildCrossword(answers: string[]): CrosswordGrid | null {
  if (answers.length < 2 || answers.length > 10 || answers.some(word => !word || word.length > 12)) return null;
  const indexes = answers.map((_, i) => i);
  const byLength = [...indexes].sort((a, b) => answers[b].length - answers[a].length);
  const original = placeCrossword(answers, indexes);
  if (original) return original;
  for (const first of byLength) {
    const placed = placeCrossword(answers, [first, ...byLength.filter(index => index !== first)]);
    if (placed) return placed;
  }
  return null;
}

function placeCrossword(answers: string[], order: number[]): CrosswordGrid | null {
  const letters = new Map<string, { cell: Cell; letter: string; directions: boolean[] }>();
  const slots: WordSlot[] = [];
  const pending = [...order];
  let skipped = 0;
  while (pending.length) {
    const index = pending.shift()!;
    const word = answers[index].toUpperCase();
    let slot: WordSlot | undefined;
    if (!letters.size) slot = { across: true, cells: Array.from(word, (_, index) => step({ row: 0, column: 0 }, index, true)) };
    else {
      search: for (const entry of letters.values()) for (const [index, letter] of Array.from(word).entries()) {
        if (letter !== entry.letter || entry.directions.length !== 1) continue;
        const across = !entry.directions[0];
        const start = step(entry.cell, -index, across);
        if (letters.has(cellKey(step(start, -1, across))) || letters.has(cellKey(step(start, word.length, across)))) continue;
        const cells = Array.from(word, (_, offset) => step(start, offset, across));
        const valid = cells.every((cell, offset) => {
          const existing = letters.get(cellKey(cell));
          if (existing) return existing.letter === word[offset] && !existing.directions.includes(across);
          return [-1, 1].every(side => !letters.has(cellKey(step(cell, side, !across))));
        });
        const all = [...Array.from(letters.values(), entry => entry.cell), ...cells];
        if (valid && (["row", "column"] as const).every(axis => {
          const positions = all.map(cell => cell[axis]);
          return Math.max(...positions) - Math.min(...positions) < 15;
        })) { slot = { across, cells }; break search; }
      }
    }
    if (!slot) {
      pending.push(index);
      if (++skipped >= pending.length) return null;
      continue;
    }
    skipped = 0;
    slot.cells.forEach((cell, index) => {
      const key = cellKey(cell);
      const existing = letters.get(key);
      if (existing) existing.directions.push(slot.across);
      else letters.set(key, { cell, letter: word[index], directions: [slot.across] });
    });
    slots[index] = slot;
  }
  if (slots.length < 2) return null;
  const all = Array.from(letters.values(), entry => entry.cell);
  const rowStart = Math.min(...all.map(cell => cell.row));
  const columnStart = Math.min(...all.map(cell => cell.column));
  return {
    height: Math.max(...all.map(cell => cell.row)) - rowStart + 1,
    width: Math.max(...all.map(cell => cell.column)) - columnStart + 1,
    slots: slots.map(slot => ({ ...slot, cells: slot.cells.map(cell => ({
      row: cell.row - rowStart, column: cell.column - columnStart,
    })) })),
  };
}

export function makeWordsearch(answer: string, index: number) {
  const word = answer.toUpperCase();
  const size = Math.max(6, word.length);
  const filler = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let state = Array.from(word).reduce((seed, letter) => Math.imul(seed, 31) + letter.charCodeAt(0), index + 101);
  const grid = Array.from({ length: size * size }, () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return filler[state % filler.length];
  });
  const across = index % 2 === 0;
  const lane = (state >>> 8) % size;
  const offset = (state >>> 16) % (size - word.length + 1);
  const positions = Array.from(word, (_, i) => across ? lane * size + offset + i : (offset + i) * size + lane);
  positions.forEach((position, i) => { grid[position] = word[i]; });
  return { grid, size, positions };
}

export function lineBetween(start: number, end: number, size: number) {
  const row = Math.floor(start / size), column = start % size;
  const dy = Math.floor(end / size) - row, dx = end % size - column;
  if (dx && dy && Math.abs(dx) !== Math.abs(dy)) return [];
  return Array.from({ length: Math.max(Math.abs(dx), Math.abs(dy)) + 1 }, (_, i) =>
    (row + i * Math.sign(dy)) * size + column + i * Math.sign(dx));
}

export function hangmanPattern(answer: string, guesses: string[]) {
  const letters = Array.from(answer.toUpperCase());
  return {
    pattern: letters.map(letter => guesses.includes(letter) ? letter : ""),
    misses: guesses.filter(letter => !letters.includes(letter)).length,
  };
}
