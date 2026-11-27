import { expect, test, type Page } from "@playwright/test";
import { starterPartNames, starterPaperSchema } from "../../lib/games/starters";

const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
async function start(page: Page, path: string) {
  await page.goto(path);
  await button(page, "Bắt đầu").click();
  await expect(page.locator(".starter-sheet")).toBeVisible();
}

test("all parts are reachable from the Starters library", async ({ page }) => {
  await page.goto("/samples/cambridge-starters");
  await expect(page.locator(".starter-paper-grid li a")).toHaveCount(13);
  await expect(page.getByRole("link", { name: /Thi thử/ })).toHaveCount(3);
  expect((await page.goto("/samples/cambridge-starters/speaking?part=5"))?.status()).toBe(404);
});

for (const paper of starterPaperSchema.options) {
  for (const [index, name] of starterPartNames[paper].entries()) {
    const part = index + 1;
    test(`${paper} Part ${part} – ${name}`, async ({ page }) => {
      await start(page, `/samples/cambridge-starters/${paper}?part=${part}`);
      await expect(page.getByText("Gợi ý luyện tập")).toBeVisible();
      if (paper === "listening") {
        const audio = page.locator("audio");
        await button(page, "Nghe đoạn hội thoại").click();
        await expect(button(page, "Dừng nghe")).toBeVisible();
        await expect.poll(() => audio.evaluate(element => (element as HTMLAudioElement).currentTime)).toBeGreaterThan(0);
        await button(page, "Dừng nghe").click();
        if (part === 1) await button(page, "Person 4").click();
        if (part === 2) await page.getByLabel("Your answer").fill("MAY");
        if (part === 3) await button(page, "B").click();
        if (part === 4) {
          await button(page, "Ball 2").click();
          await button(page, "blue").click();
        }
      }
      if (paper === "reading") {
        if (part === 1) await button(page, "✓ Tick").click();
        if (part === 2) await page.getByLabel("Your answer").fill("yes");
        if (part === 3) {
          await button(page, "b").click();
          await button(page, "a").click();
          await page.getByRole("button", { name: "l", exact: true }).first().click();
          await page.getByRole("button", { name: "l", exact: true }).last().click();
        }
        if (part === 4) await button(page, "water").click();
        if (part === 5) await page.getByLabel("Your answer").fill("red");
      }
      if (paper === "speaking") {
        if (part === 1) {
          await button(page, "apple").click();
          await button(page, "Person 1").click();
          await expect(page.getByText("apple → 1")).toBeVisible();
        }
        await expect(page.getByRole("button", { name: /microphone|ghi âm/ })).toHaveCount(0);
      } else {
        await button(page, "Tiếp theo").click();
        await expect(page.getByText("Mục 1: Chính xác!")).toBeVisible();
        for (let i = 0; i < 3; i++) await button(page, "Tiếp theo").click();
      }
      await button(page, "Nộp bài").click();
      await expect(page.getByRole("heading", { name: "Hoàn thành!" })).toBeVisible();
      if (paper !== "speaking") {
        await expect(page.getByText("1/5 điểm", { exact: true })).toBeVisible();
        await expect(page.getByText("Xem lại câu sai (4)", { exact: true })).toBeVisible();
      }
    });
  }
}

test("Listening mock keeps the same clip across questions and caps replays", async ({ page }) => {
  await start(page, "/samples/cambridge-starters/listening");
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByText("Gợi ý luyện tập")).toHaveCount(0);
  await expect(page.getByText("Ví dụ mẫu")).toBeVisible();
  for (let play = 1; play <= 2; play++) {
    await button(page, "Nghe đoạn hội thoại").click();
    await expect(page.getByText(`Lượt nghe ${play}/2`)).toBeVisible();
    await page.locator("audio").evaluate(async element => {
      const audio = element as HTMLAudioElement;
      if (!Number.isFinite(audio.duration)) await new Promise(resolve => audio.addEventListener("loadedmetadata", resolve, { once: true }));
      audio.currentTime = audio.duration - .05;
    });
    await expect(button(page, "Nghe đoạn hội thoại")).toBeVisible();
  }
  await expect(button(page, "Nghe đoạn hội thoại")).toBeDisabled();
  await button(page, "Person 4").click();
  await button(page, "Tiếp theo").click();
  await expect(button(page, "Nghe đoạn hội thoại")).toBeDisabled();
  await expect(page.getByText(/Chính xác/)).toHaveCount(0);
  await button(page, "Câu trước").click();
  await expect(button(page, "Person 4")).toHaveAttribute("aria-pressed", "true");
});

test("Reading mock submits elapsed answers on time and Speaking spans all four parts", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-27T15:00:00+07:00") });
  await start(page, "/samples/cambridge-starters/reading");
  await button(page, "✓ Tick").click();
  await page.clock.fastForward(20 * 60 * 1000 + 1000);
  await expect(page.getByText("1/25 điểm", { exact: true })).toBeVisible();
  await start(page, "/samples/cambridge-starters/speaking");
  for (const part of [1, 2, 3, 4]) {
    await expect(page.getByText(new RegExp(`^Part ${part} ·`))).toBeVisible();
    await button(page, part === 4 ? "Nộp bài" : "Tiếp theo").click();
  }
  await expect(page.getByRole("heading", { name: "Hoàn thành!" })).toBeVisible();
});
