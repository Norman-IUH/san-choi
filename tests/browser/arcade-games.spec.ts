import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { arcadeTemplates, hasArcadeCanvas, type ArcadeTemplate } from "../../lib/games/arcade-templates";
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
    if (hasArcadeCanvas(template)) await expect(field.locator("[data-ready=true] canvas")).toBeVisible({ timeout: 25000 });
    else await expect(field).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole("timer")).toHaveCount(0);
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
    await expect(page.getByText("Đang tạm dừng", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tiếp tục chơi", exact: true }).click();
    await expect(page.getByText("Đang tạm dừng", { exact: true })).toHaveCount(0);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect(page.getByText("Đang tạm dừng", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tiếp tục chơi", exact: true }).click();
    const viewport = page.viewportSize()!;
    if (info.project.name === "mobile") {
      await page.setViewportSize({ width: viewport.height, height: viewport.width });
      await expect(field).toBeVisible();
      await page.setViewportSize(viewport);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await capture("playing");
    await playArcade(page, template, demoContent(template));
    await expect(page.getByText(template === "win-or-lose-quiz" ? "2/3 điểm" : "1/2 điểm", { exact: true })).toBeVisible();
    await expect(field.locator("canvas")).toHaveCount(0);
    await capture("result");
    await page.getByRole("button", { name: "Chơi lại" }).click();
    await expect(start).toBeVisible();
  });
}

test("arcade fullscreen keeps the playfield and controls visible", async ({ page }, info) => {
  await page.goto("/demo/maze-chase");
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  const field = page.locator(".arcade-field");
  await expect(field.locator("[data-ready=true] canvas")).toBeVisible({ timeout: 20000 });
  const viewport = page.viewportSize()!;
  if (info.project.name === "mobile" || info.project.name === "ios") await page.setViewportSize({ width: viewport.height, height: viewport.width });
  await page.getByRole("button", { name: "Toàn màn hình", exact: true }).click();
  const exit = page.getByRole("button", { name: "Thoát toàn màn hình", exact: true });
  await expect(exit).toBeVisible();
  await expect(field).toBeVisible();
  await expect(page.getByRole("group", { name: "Điều khiển di chuyển" }).getByRole("button", { name: "Lên", exact: true })).toBeEnabled();
  await exit.click();
  await expect(page.getByRole("button", { name: "Toàn màn hình", exact: true })).toBeVisible();
});
