import { expect, test } from "@playwright/test";

for (const template of ["quiz", "flip-tiles", "maze-chase"] as const) {
  test(`${template} immersive layout keeps navigation and main controls usable`, async ({ page, browserName }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/demo/" + template);
    const shell = page.locator(".game-stage");
    const start = shell.getByRole("button", { name: "Bắt đầu", exact: true });
    await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toBeHidden();
    await expect(shell.getByRole("link", { name: "Tất cả mẫu" })).toBeVisible();
    await expect(shell.getByRole("button", { name: "Âm thanh phản hồi" })).toHaveAttribute("aria-pressed", "false");
    expect((await start.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(start).toBeEnabled();
    await start.press("Enter");
    await expect(shell.locator(".play-stack")).toBeVisible();
    await expect(shell.locator(".player-top").getByRole("progressbar")).toBeVisible();
    if (process.platform === "win32" && browserName === "chromium") {
      await expect(shell.locator(".player-top")).toHaveScreenshot(`${template}-hud.png`, { animations: "disabled", maxDiffPixelRatio: .015 });
    }
    if (template === "maze-chase") {
      const portrait = page.viewportSize()!.width <= 600;
      await expect(shell.locator("[data-ready=true] canvas")).toHaveAttribute("width", portrait ? "720" : "960");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
    if (template === "quiz") {
      await shell.getByRole("button", { name: "Tạm dừng" }).click();
      await expect(shell.getByRole("dialog", { name: "Tạm dừng trò chơi" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(shell.getByRole("dialog")).toBeHidden();
      const original = page.viewportSize()!;
      if (original.width < original.height) await page.setViewportSize({ width: original.height, height: original.width });
      await expect(shell.getByRole("heading", { level: 2 })).toBeInViewport();
      const answers = shell.getByRole("group", { name: "Chọn một đáp án." });
      expect((await answers.getByRole("button").first().boundingBox())!.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
    }
  });
}

test("library filters gameplay thumbnails without fetching every template on entry", async ({ page }) => {
  const thumbnails = new Set<string>();
  page.on("request", request => {
    if (request.url().includes("/illustrations/gameplay/")) thumbnails.add(request.url());
  });
  await page.goto("/");
  await expect(page.locator(".game-gallery .template-card")).toHaveCount(34);
  expect(thumbnails.size).toBeLessThan(34);
  await page.getByLabel("Nhóm trò chơi").selectOption("arcade");
  await expect(page.locator(".game-gallery .template-card")).toHaveCount(7);
  await page.getByRole("searchbox", { name: "Tìm mẫu" }).fill("Airplane");
  const airplane = page.locator(".game-gallery .template-card");
  await expect(airplane).toHaveCount(1);
  await airplane.scrollIntoViewIfNeeded();
  await expect.poll(() => airplane.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
});

test("Watch and Memorize enlarges the presentation before hiding the cards", async ({ page }) => {
  await page.goto("/demo/watch-memorize");
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  const cards = page.getByRole("list", { name: "Chuỗi cần nhớ" });
  await page.getByRole("button", { name: "Trình chiếu thẻ" }).click();
  await expect(cards).toHaveAttribute("data-presenting", "true");
  await page.getByRole("button", { name: "Che thẻ và xếp lại" }).click();
  await expect(cards).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Các thẻ để xếp" })).toBeVisible();
});

test("Rank Order can move a card by dragging its touch handle", async ({ page, browserName }, info) => {
  test.skip(browserName !== "chromium" || info.project.name === "desktop", "Emulated touch drag uses CDP");
  await page.goto("/demo/rank-order");
  await page.getByRole("button", { name: "Bắt đầu" }).tap();
  const cards = page.getByRole("list", { name: "Thứ tự của em" }).getByRole("listitem");
  const first = await cards.first().innerText();
  const from = (await cards.first().locator(".rank-grip").boundingBox())!;
  const to = (await cards.nth(1).boundingBox())!;
  const device = await page.context().newCDPSession(page);
  await device.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from.x + from.width / 2, y: from.y + from.height / 2 }] });
  await device.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: to.x + to.width / 2, y: to.y + to.height / 2 }] });
  await device.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(cards.nth(1)).toContainText(first.trim().split(/\r?\n/)[0]);
});
