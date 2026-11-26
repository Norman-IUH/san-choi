import { expect, type Page } from "@playwright/test";
import type { Item } from "../../lib/game";
import { mathProblem, type PuzzleTemplate } from "../../lib/games/puzzle-templates";

export async function solvePuzzle(page: Page, template: PuzzleTemplate, items: Item[], wrongFirst = false) {
  if (template === "flip-tiles") {
    const board = page.locator(".flip-grid");
    await expect(page.getByRole("button", { name: "Hoàn thành" })).toBeDisabled();
    for (const item of items) {
      await board.getByRole("button", { name: item.prompt + " Lật ô", exact: true }).click();
      await expect(board.getByRole("button", { name: item.answers[0] + " Về mặt trước", exact: true })).toBeVisible();
    }
    await page.getByRole("button", { name: "Hoàn thành" }).click();
    return;
  }
  for (const [index, item] of items.entries()) {
    await expect(page.getByRole("progressbar", { name: "Mục " + (index + 1) + " / " + items.length })).toBeVisible();
    const wrong = wrongFirst && index === 0;
    switch (template) {
      case "labelled-diagram": {
        const pin = page.locator(".diagram-pin");
        await expect(pin).toBeVisible();
        const response = wrong ? item.options.find(option => option !== item.answers[0])! : item.answers[0];
        await page.getByRole("group", { name: "Nhãn sơ đồ" }).getByRole("button", { name: response, exact: true }).click();
        await expect(pin).toContainText(response);
        break;
      }
      case "rank-order": {
        const rank = page.getByRole("list", { name: "Thứ tự của em" });
        const desired = wrong ? [...item.answers].reverse() : item.answers;
        const labels = rank.getByRole("listitem").locator("span");
        const touch = await page.evaluate(() => navigator.maxTouchPoints > 0);
        for (const [position, label] of desired.entries()) {
          const current = (await labels.allTextContents()).indexOf(label);
          expect(current).toBeGreaterThanOrEqual(position);
          for (let step = current; step > position; step--) {
            const move = rank.getByRole("button", { name: "Đưa lên " + label, exact: true });
            await expect(move).toBeEnabled();
            if (touch) await move.tap();
            else await move.press("Enter");
            await expect(labels.nth(step - 1)).toHaveText(label);
          }
        }
        break;
      }
      case "pair-or-no-pair":
      case "image-quiz": {
        const option = wrong ? item.options.find(option => option !== item.answers[0])! : item.answers[0];
        const button = page.getByRole("button", { name: option, exact: true });
        if (template === "image-quiz") await expect.poll(() => button.locator("img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
        await button.click();
        break;
      }
      case "watch-memorize": {
        await expect(page.getByRole("list", { name: "Chuỗi cần nhớ" })).toBeVisible();
        await page.getByRole("button", { name: "Che thẻ và xếp lại" }).click();
        await expect(page.getByRole("list", { name: "Chuỗi cần nhớ" })).toHaveCount(0);
        const options = page.getByRole("group", { name: "Các thẻ để xếp" });
        for (const word of wrong ? [...item.answers].reverse() : item.answers) {
          await options.getByRole("button", { name: word, exact: true }).and(page.locator(":enabled")).first().click();
        }
        break;
      }
      case "maths-generator": {
        const solution = mathProblem(item.math!, index).answer;
        await page.getByLabel("Kết quả phép tính").fill(wrong ? String(Number(solution) + 1) : solution);
        break;
      }
    }
    await page.getByRole("button", { name: index + 1 === items.length ? "Hoàn thành" : "Tiếp theo", exact: true }).click();
  }
}
