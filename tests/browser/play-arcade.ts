import { expect, type Page } from "@playwright/test";
import { arenaWidth, arenaHeight, mazeDestinations, stepMaze, type Direction } from "../../lib/games/arcade-runtime";
import { hasArcadeCanvas, type ArcadeTemplate } from "../../lib/games/arcade-templates";
import type { Item } from "../../lib/game";

export async function playArcade(page: Page, template: ArcadeTemplate, items: Item[], afterFirst?: () => Promise<void>) {
  const field = page.locator(".arcade-field");
  for (const [turn, item] of items.entries()) {
    await expect(page.getByRole("progressbar", { name: "Mục " + (turn + 1) + " / " + items.length })).toBeVisible();
    const desired = turn === 0 ? item.options.find(option => option !== item.answers[0])! : item.answers[0];
    if (!hasArcadeCanvas(template)) {
      if (template === "speed-sorting") {
        const token = page.getByRole("button", { name: "Cầm thẻ " + item.prompt, exact: true });
        const bin = page.getByRole("button", { name: desired, exact: true });
        if (await page.evaluate(() => navigator.maxTouchPoints > 0)) {
          await token.tap();
          await bin.tap();
        } else {
          await token.scrollIntoViewIfNeeded();
          await bin.scrollIntoViewIfNeeded();
          const from = (await token.boundingBox())!;
          const to = (await bin.boundingBox())!;
          await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
          await page.mouse.down();
          await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
          await page.mouse.up();
        }
      } else {
        if (turn === 1) await page.getByRole("button", { name: "Thử sức", exact: true }).click();
        await page.getByRole("button", { name: desired, exact: true }).click();
      }
      await expect(page.getByText("Đã chọn " + desired, { exact: true })).toBeVisible();
      await page.getByRole("button", { name: turn + 1 === items.length ? "Hoàn thành" : "Tiếp theo", exact: true }).click();
      if (turn === 0) await afterFirst?.();
      continue;
    }
    await expect(field.locator("[data-ready=true] canvas")).toBeVisible({ timeout: 20000 });
    const choices = page.locator(".arcade-support .options");
    await page.locator(".arcade-support summary").click();
    const labels = (await choices.locator("> div > span, > div > button").allTextContents()).map(value => value.trim());
    const target = labels.indexOf(desired);
    expect(target).toBeGreaterThanOrEqual(0);
    if (template === "maze-chase") {
      const [x, y] = mazeDestinations[target];
      const blocked = new Set(mazeDestinations.slice(0, labels.length).filter((_, index) => index !== target).map(pair => pair.join(",")));
      const queue: { x: number; y: number; steps: Direction[] }[] = [{ x: 0, y: 3, steps: [] }];
      const visited = new Set(["0,3"]);
      let path: Direction[] = [];
      while (queue.length) {
        const current = queue.shift()!;
        if (current.x === x && current.y === y) { path = current.steps; break; }
        for (const direction of ["up", "down", "left", "right"] as const) {
          const next = stepMaze(current, direction);
          const key = next.x + "," + next.y;
          if (!visited.has(key) && !blocked.has(key)) {
            visited.add(key);
            queue.push({ ...next, steps: [...current.steps, direction] });
          }
        }
      }
      expect(path.length).toBeGreaterThan(0);
      const keys = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
      const names = { up: "Lên", down: "Xuống", left: "Trái", right: "Phải" };
      const touch = await page.evaluate(() => navigator.maxTouchPoints > 0);
      for (const direction of path) {
        if (touch) await page.getByRole("button", { name: names[direction], exact: true }).tap();
        else await field.press(keys[direction]);
      }
    } else {
      await page.locator(".arcade-support summary").click();
      const canvas = field.locator("canvas");
      await canvas.scrollIntoViewIfNeeded();
      const bounds = (await canvas.boundingBox())!;
      const x = template === "airplane" ? 460 : 145 + target * 222;
      const y = template === "airplane" ? 60 + (target + .5) * (360 / labels.length) : template === "whack-a-mole" ? 226 : 206;
      const position = { x: x / arenaWidth * bounds.width, y: y / arenaHeight * bounds.height };
      const touch = await page.evaluate(() => navigator.maxTouchPoints > 0);
      const strike = () => touch ? canvas.tap({ position }) : canvas.click({ position });
      if (template === "whack-a-mole") {
        const hit = page.getByText("Đã chọn " + desired, { exact: true });
        await expect(async () => {
          if (!(await hit.isVisible())) await strike();
          await expect(hit).toBeVisible({ timeout: 400 });
        }).toPass({ timeout: 8000 });
      } else await strike();
    }
    await expect(page.getByText("Đã chọn " + desired, { exact: true })).toBeVisible({ timeout: 18000 });
    await page.getByRole("button", { name: turn + 1 === items.length ? "Hoàn thành" : "Tiếp theo", exact: true }).click();
    if (turn === 0) await afterFirst?.();
  }
}
