import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { arcadeTemplates, type ArcadeTemplate } from "../../lib/games/arcade-templates";
import { demoContent } from "../../lib/demo";
import { playArcade } from "./play-arcade";

for (const template of Object.keys(arcadeTemplates) as ArcadeTemplate[]) {
  test(template + " plays an incorrect and correct round, pauses and replays", async ({ page }, info) => {
    test.setTimeout(85000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/demo/" + template);
    const start = page.getByRole("button", { name: "Bắt đầu" });
    await expect(start).toBeEnabled({ timeout: 20000 });
    const output = process.env.ARCADE_SCREENSHOTS;
    const capture = async (state: string) => {
      if (!output) return;
      const folder = output + "/" + info.project.name;
      await mkdir(folder, { recursive: true });
      await page.screenshot({ path: folder + "/" + template + "-" + state + ".png", fullPage: true, animations: "disabled" });
    };
    await capture("start");
    await start.click();
    const field = page.locator(".arcade-field");
    await expect(field.locator("[data-ready=true] canvas")).toBeVisible({ timeout: 25000 });
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
    await expect(page.getByText("Đang tạm dừng", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tiếp tục chơi", exact: true }).click();
    await expect(page.getByText("Đang tạm dừng", { exact: true })).toHaveCount(0);
    const viewport = page.viewportSize()!;
    if (info.project.name === "mobile") {
      await page.setViewportSize({ width: viewport.height, height: viewport.width });
      await expect(field).toBeVisible();
      await page.setViewportSize(viewport);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await capture("playing");
    await playArcade(page, template, demoContent(template));
    await expect(page.getByText("1/2 điểm", { exact: true })).toBeVisible();
    await expect(field.locator("canvas")).toHaveCount(0);
    await capture("result");
    await page.getByRole("button", { name: "Chơi lại" }).click();
    await expect(start).toBeVisible();
  });
}
