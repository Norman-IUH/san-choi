import { expect, type Page } from "@playwright/test";
import type { Item } from "../../lib/game";
import { makeWordsearch } from "../../lib/games/word-puzzles";
import type { WordTemplate } from "../../lib/games/word-templates";

export async function solveWordGame(page: Page, template: WordTemplate, items: Item[]) {
  if (template === "matching-pairs") {
    const left = page.getByRole("group", { name: "Thẻ gợi ý" });
    const right = page.getByRole("group", { name: "Thẻ đáp án" });
    for (const [i, item] of items.entries()) {
      await left.getByRole("button", { name: "Gợi ý " + (i + 1), exact: true }).click();
      for (const card of await right.getByRole("button").all()) {
        if (!await card.isEnabled()) continue;
        await card.click();
        if ((await card.innerText()) === item.answers[0]) break;
      }
      await expect(right.getByRole("button", { name: item.answers[0], exact: true })).toHaveAttribute("aria-pressed", "true");
      await page.getByRole("button", { name: "Ghép hai thẻ" }).click();
    }
    await page.getByRole("button", { name: "Hoàn thành" }).click();
    return;
  }
  if (template === "crossword") {
    const clues = page.getByRole("group", { name: "Gợi ý ô chữ" });
    for (const [i, item] of items.entries()) {
      await clues.getByRole("button").nth(i).click();
      await page.getByLabel("Đáp án ô chữ " + (i + 1)).fill(item.answers[0]);
    }
    await page.getByRole("button", { name: "Hoàn thành" }).click();
    return;
  }
  for (const [i, item] of items.entries()) {
    await expect(page.getByRole("heading", { name: item.prompt, exact: true })).toBeVisible();
    switch (template) {
      case "type-answer":
        await page.getByLabel("Câu trả lời").fill(item.answers[0]);
        break;
      case "spell-word":
        await page.getByLabel("Đánh vần").fill(item.answers[0]);
        await expect(page.locator(".spell-cells")).toContainText(item.answers[0].toUpperCase());
        break;
      case "wordsearch": {
        const { positions } = makeWordsearch(item.answers[0], i);
        const board = page.getByRole("group", { name: "Lưới tìm từ" });
        await board.getByRole("button").nth(positions[0]).click();
        await board.getByRole("button").nth(positions.at(-1)!).click();
        break;
      }
      case "hangman":
        if (i === 0) {
          await page.getByRole("button", { name: "Z", exact: true }).click();
          await expect(page.getByText(/Còn 5 lượt sai/)).toBeVisible({ timeout: 25000 });
        }
        for (const letter of new Set(item.answers[0].toUpperCase())) await page.getByRole("button", { name: letter, exact: true }).click({ timeout: 25000 });
        break;
      case "true-false":
        await page.getByRole("button", { name: item.answers[0], exact: true }).click();
        break;
      case "word-magnets":
        for (const word of item.answers) {
          await page.getByRole("group", { name: "Nam châm từ" }).getByRole("button", { name: word, exact: true }).and(page.locator(":enabled")).first().click();
        }
        break;
    }
    await page.getByRole("button", { name: i + 1 === items.length ? "Hoàn thành" : "Tiếp theo", exact: true }).click({ timeout: 25000 });
  }
}
