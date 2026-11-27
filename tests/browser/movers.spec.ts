import { expect, test, type Page } from "@playwright/test";

const root = "/samples/cambridge-movers";
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
async function start(page: Page, path: string) {
  await page.goto(`${root}/${path}`);
  await button(page, "Bắt đầu").click();
  await expect(page.locator(".starter-sheet")).toBeVisible();
}

const reading = [
  [5, "helmet"], [6, "How about lemonade?"], [6, "bottle"],
  [5, "but"], [7, "old library"], [6, "green"],
] as const;

for (const [index, [count, answer]] of reading.entries()) {
  test(`Movers Reading & Writing Part ${index + 1}`, async ({ page }) => {
    await start(page, "reading?part=" + (index + 1));
    const input = page.getByLabel("Your answer");
    if (index === 1) await button(page, answer).click();
    else {
      if ([0, 2, 3].includes(index)) {
        await button(page, answer).click();
        await expect(input).toBeFocused();
        await expect(input).toBeEmpty();
      }
      await input.fill(answer);
    }
    await button(page, "Tiếp theo").click();
    await expect(page.getByText("Mục 1: Chính xác!")).toBeVisible();
    if (index === 2) {
      for (let i = 0; i < 4; i++) await button(page, "Tiếp theo").click();
      await button(page, "Zara finds a lost bag").click();
      await next(page, 1);
      await expect(page.getByText("2/6 điểm", { exact: true })).toBeVisible();
      return;
    }
    if (index === 4) {
      await expect(page.getByRole("img", { name: "Story picture" })).toBeVisible();
      await button(page, "Tiếp theo").click();
      await expect(page.getByText(/At the fair, Leo and Nina/)).toBeVisible();
      await next(page, count - 2);
      return;
    }
    if (index === 5) {
      for (let i = 0; i < 3; i++) await button(page, "Tiếp theo").click();
      await page.locator("textarea").fill("A person is standing to the left of the stall.");
      await button(page, "Tiếp theo").click();
      await page.locator("textarea").fill("There is a drum beside the stall.");
      await next(page, 1);
      await expect(page.getByText("1/4 điểm tự động", { exact: true })).toBeVisible();
      await expect(page.getByText(/Giáo viên có thể chấm hai câu viết mở/)).toBeVisible();
      return;
    }
    await next(page, count - 1);
    await expect(page.getByText(`1/${count} điểm`, { exact: true })).toBeVisible();
  });
}
async function next(page: Page, remaining: number) {
  for (let i = 1; i < remaining; i++) await button(page, "Tiếp theo").click();
  await button(page, "Nộp bài").click();
  await expect(page.getByRole("heading", { name: "Hoàn thành!" })).toBeVisible();
}

test("Movers library links all fifteen practice parts and three mocks", async ({ page }) => {
  await page.goto(root);
  await expect(page.locator(".starter-paper-grid li a")).toHaveCount(15);
  await expect(page.getByRole("link", { name: /^Thi thử/ })).toHaveCount(3);
  expect((await page.goto(root + "/listening?part=6"))?.status()).toBe(404);
});

for (const part of [1, 2, 3, 4]) {
  test(`Movers Speaking Part ${part}`, async ({ page }) => {
    await start(page, "speaking?part=" + part);
    await expect(page.getByText("Gợi ý luyện tập")).toBeVisible();
    if (part === 1 || part === 2) await expect(page.locator(".mover-scenes figure")).toHaveCount(part === 1 ? 2 : 4);
    if (part === 3) {
      for (let group = 1; group <= 4; group++) {
        const cards = page.getByRole("group", { name: "Set " + group }).getByRole("button");
        await expect(cards).toHaveCount(4);
        await cards.nth(1).focus();
        await page.keyboard.press("Space");
        await expect(cards.nth(1)).toHaveAttribute("aria-pressed", "true");
      }
    }
    await expect(page.locator("audio, .starter-sheet input, .starter-sheet textarea")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /microphone|ghi âm/ })).toHaveCount(0);
    await next(page, 1);
    await expect(page.locator(".game-completion strong")).toHaveCount(0);
  });
}

test("Movers mock timers, two audio plays, and routes between speaking parts", async ({ page }) => {
  await page.clock.install();
  await start(page, "listening");
  await expect(page.getByRole("timer")).toHaveText(/^(?:25:00|24:59)$/);
  await expect(page.getByText("Gợi ý luyện tập")).toHaveCount(0);
  for (const play of [1, 2]) {
    await button(page, "Nghe đoạn hội thoại").click();
    await expect(page.getByText(`Lượt nghe ${play}/2`)).toBeVisible();
    await page.locator("audio").evaluate(async element => {
      const audio = element as HTMLAudioElement;
      if (!Number.isFinite(audio.duration)) await new Promise(resolve => audio.addEventListener("loadedmetadata", resolve, { once: true }));
      audio.currentTime = audio.duration - .05;
    });
    await expect(button(page, "Nghe đoạn hội thoại")).toBeVisible();
  }
  await button(page, "Person 2").click();
  await button(page, "Tiếp theo").click();
  await expect(button(page, "Nghe đoạn hội thoại")).toBeDisabled();
  await button(page, "Câu trước").click();
  await expect(button(page, "Person 2")).toHaveAttribute("aria-pressed", "true");
  await page.clock.fastForward(25 * 60 * 1000 + 1000);
  await expect(page.getByText("1/25 điểm", { exact: true })).toBeVisible();
  await start(page, "reading");
  await expect(page.getByRole("timer")).toHaveText(/^(?:30:00|29:59)$/);
  await page.getByLabel("Your answer").fill("helmet");
  await page.clock.fastForward(30 * 60 * 1000 + 1000);
  await expect(page.getByText("1/33 điểm tự động", { exact: true })).toBeVisible();
  await start(page, "speaking");
  await expect(page.getByRole("timer")).toHaveText(/^(?:7:00|6:59)$/);
  await expect(page.getByText("Gợi ý luyện tập")).toHaveCount(0);
  await button(page, "Tiếp theo").click();
  await button(page, "Tiếp theo").click();
  const choice = page.getByRole("group", { name: "Set 1" }).getByRole("button").nth(2);
  await choice.click();
  await button(page, "Tiếp theo").click();
  await button(page, "Câu trước").click();
  await expect(choice).toHaveAttribute("aria-pressed", "true");
  await button(page, "Tiếp theo").click();
  await next(page, 1);
});

for (const part of [1, 2, 3, 4, 5]) {
  test(`Movers Listening Part ${part}`, async ({ page }) => {
    await start(page, "listening?part=" + part);
    await expect(page.getByText("Gợi ý luyện tập")).toBeVisible();
    await button(page, "Nghe đoạn hội thoại").click();
    await expect(button(page, "Dừng nghe")).toBeVisible();
    await expect.poll(() => page.locator("audio").evaluate(element => (element as HTMLAudioElement).currentTime)).toBeGreaterThan(0);
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
