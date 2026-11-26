import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { demoContent } from "../../lib/demo";
import { puzzleTemplates, type PuzzleTemplate } from "../../lib/games/puzzle-templates";
import { solvePuzzle } from "./solve-puzzle";

for (const template of Object.keys(puzzleTemplates) as PuzzleTemplate[]) {
  test(template + " plays, grades mistakes and replays", async ({ page }, info) => {
    test.setTimeout(60000);
    if (template === "flip-tiles") await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/demo/" + template);
    const items = demoContent(template);
    const start = page.getByRole("button", { name: "Bắt đầu" });
    await expect(start).toBeEnabled();
    if (["mobile", "tablet", "ios"].includes(info.project.name)) await start.tap();
    else await start.press("Enter");
    const board = page.locator(".game-stage > .play-stack");
    await expect(board).toBeVisible();
    if (template === "flip-tiles") await expect(board.locator(".flash-face").first()).toHaveCSS("animation-name", "none");
    const output = process.env.V14B_SCREENSHOTS;
    if (output && info.project.name === "desktop") {
      await mkdir(output, { recursive: true });
      await board.screenshot({ path: output + "/" + template + ".png", animations: "disabled" });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
    await solvePuzzle(page, template, items, true);
    await expect(page.getByRole("heading", { name: "Hoàn thành!" })).toBeVisible();
    if (template !== "flip-tiles") await expect(page.getByText((items.length - 1) + "/" + items.length + " điểm", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Chơi lại" }).click();
    await expect(start).toBeVisible();
  });
}
