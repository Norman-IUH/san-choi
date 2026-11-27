import { captureGame } from "./capture-game";
import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { demoContent } from "../../lib/demo";
import { wordTemplates, type WordTemplate } from "../../lib/games/word-templates";
import { solveWordGame } from "./solve-word-game";

for (const template of Object.keys(wordTemplates) as WordTemplate[]) {
  test(template + " completes and replays its own game", async ({ page }, info) => {
    const items = demoContent(template);
    await page.goto("/demo/" + template);
    await captureGame(page, info, template, "start");
    await page.getByRole("button", { name: "Bắt đầu" }).click();
    const board = page.locator(".game-stage > .play-stack");
    await expect(board).toBeVisible();
    await captureGame(page, info, template, "playing");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
    const output = process.env.V14_SCREENSHOTS;
    if (output && info.project.name === "desktop") {
      await mkdir(output, { recursive: true });
      await board.screenshot({ path: output + "/" + template + ".png", animations: "disabled" });
    }
    await solveWordGame(page, template, items);
    await expect(page.getByText(items.length + "/" + items.length + " điểm", { exact: true })).toBeVisible();
    await captureGame(page, info, template, "result");
    await page.getByRole("button", { name: "Chơi lại" }).click();
    await expect(page.getByRole("button", { name: "Bắt đầu" })).toBeVisible();
  });
}
