import { expect, test, type Page } from "@playwright/test";

const root = "/samples/cambridge-movers";
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
async function start(page: Page, path: string) {
  await page.goto(`${root}/${path}`);
  await button(page, "Bắt đầu").click();
  await expect(page.locator(".starter-sheet")).toBeVisible();
}
async function next(page: Page, remaining: number) {
  for (let i = 1; i < remaining; i++) await button(page, "Tiếp theo").click();
  await button(page, "Nộp bài").click();
  await expect(page.getByRole("heading", { name: "Hoàn thành!" })).toBeVisible();
}

for (const part of [1, 2, 3, 4, 5]) {
  test(`Movers Listening Part ${part}`, async ({ page }) => {
    await start(page, "listening?part=" + part);
    await expect(page.getByText("Gợi ý luyện tập")).toBeVisible();
    await button(page, "Nghe đoạn hội thoại").click();
    await expect(button(page, "Dừng nghe")).toBeVisible();
    await expect.poll(() => page.locator("audio").evaluate(element => element.currentTime)).toBeGreaterThan(0);
    await button(page, "Dừng nghe").click();
    if (part === 1) await button(page, "Person 2").click();
    if (part === 2) {
      await page.getByLabel("Your answer").fill("Saturday");
      await expect(page.locator(".mover-booking [aria-current]")).toHaveText("DaySaturday");
    }
    if (part === 3) {
      await expect(page.getByRole("list", { name: "People to match" }).getByRole("listitem")).toHaveCount(5);
      await button(page, "F").click();
    }
    if (part === 4) await button(page, "C").click();
    if (part === 5) {
      await button(page, "Object 1").click();
      await button(page, "purple").click();
      for (let i = 0; i < 3; i++) await button(page, "Tiếp theo").click();
      await expect(button(page, "Object 1 purple")).toBeDisabled();
      await page.getByLabel("Word on the sign").fill("open");
      await button(page, "Tiếp theo").click();
      await next(page, 1);
      await expect(page.getByText("2/5 điểm", { exact: true })).toBeVisible();
      return;
    }
    await button(page, "Tiếp theo").click();
    await expect(page.getByText("Mục 1: Chính xác!")).toBeVisible();
    if (part === 3) await expect(button(page, "F")).toBeDisabled();
    await next(page, 4);
    await expect(page.getByText("1/5 điểm", { exact: true })).toBeVisible();
  });
}
