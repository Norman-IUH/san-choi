import { expect, test, type Page } from "@playwright/test";

const root = "/samples/cambridge-flyers";
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
async function start(page: Page, path: string) {
  await page.goto(`${root}/${path}`);
  await button(page, "Bắt đầu").click();
  await expect(page.locator(".starter-sheet")).toBeVisible();
}
async function finish(page: Page, count: number) {
  for (let i = 1; i < count; i++) await button(page, "Tiếp theo").click();
  await button(page, "Nộp bài").click();
  await expect(page.getByRole("heading", { name: "Hoàn thành!" })).toBeVisible();
}

test("Flyers mock keeps time, answers and audio listens after reload", async ({ page }) => {
  await page.clock.install();
  await start(page, "listening");
  await expect(page.getByRole("timer")).toHaveText(/^(?:25:00|24:59)$/);
  await button(page, "Person 3").click();
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
  const savedDeadline = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("san-choi-cambridge:flyers/listening") ?? "{}").deadline as number);
  const originalDeadline = await savedDeadline();
  await page.clock.fastForward(3 * 60 * 1000);
  await page.reload();
  await button(page, "Bắt đầu").click();
  await expect(page.getByRole("timer")).toHaveText(/^(?:22:00|21:[3-5]\d)$/);
  expect(await savedDeadline()).toBe(originalDeadline);
  await expect(button(page, "Person 3")).toHaveAttribute("aria-pressed", "true");
  await expect(button(page, "Nghe đoạn hội thoại")).toBeDisabled();
  await page.clock.fastForward(22 * 60 * 1000 + 1000);
  await expect(page.getByText("1/25 điểm", { exact: true })).toBeVisible();
  await start(page, "reading");
  await expect(page.getByRole("timer")).toHaveText(/^(?:40:00|39:59)$/);
  await expect(page.getByText("Ví dụ mẫu")).toBeVisible();
  await page.getByLabel("Your answer").fill("architect");
  await page.clock.fastForward(40 * 60 * 1000 + 1000);
  await expect(page.getByText("1/43 điểm tự động", { exact: true })).toBeVisible();
  await start(page, "speaking");
  await expect(page.getByRole("timer")).toHaveText(/^(?:9:00|8:59)$/);
  await expect(page.getByText("Gợi ý luyện tập")).toHaveCount(0);
  await finish(page, 4);
});

for (const part of [1, 2, 3, 4, 5]) {
  test(`Flyers Listening Part ${part}`, async ({ page }) => {
    await start(page, "listening?part=" + part);
    await button(page, "Nghe đoạn hội thoại").click();
    await expect(button(page, "Dừng nghe")).toBeVisible();
    await expect.poll(() => page.locator("audio").evaluate(element => (element as HTMLAudioElement).currentTime)).toBeGreaterThan(0);
    await button(page, "Dừng nghe").click();
    if (part === 1) await button(page, "Person 3").click();
    if (part === 2) await page.getByLabel("Your answer").fill("harbour");
    if (part === 3) {
      await expect(page.getByRole("list", { name: "People to match" }).getByRole("listitem")).toHaveCount(5);
      await button(page, "E").click();
    }
    if (part === 4) await button(page, "C").click();
    if (part === 5) {
      await button(page, "Object 1").click();
      await button(page, "purple").click();
      await expect(page.locator(".mover-colour-fill")).toHaveCount(1);
      await button(page, "Tiếp theo").click();
      await page.getByLabel("Word on the left sign").fill("boats");
      for (let i = 0; i < 3; i++) await button(page, "Tiếp theo").click();
      await expect(page.locator(".flyer-sign-left")).toHaveText("boats");
      await page.getByLabel("Word on the right sign").fill("wrong");
      await finish(page, 1);
      await expect(page.getByText("2/5 điểm", { exact: true })).toBeVisible();
      return;
    }
    await button(page, "Tiếp theo").click();
    await expect(page.getByText("Mục 1: Chính xác!")).toBeVisible();
    await finish(page, 4);
    await expect(page.getByText("1/5 điểm", { exact: true })).toBeVisible();
  });
}

const reading = [
  [10, "architect"], [5, "C I'd love to see the seabirds."], [6, "storm"], [10, "are"], [7, "red"], [5, "for"], [1, ""],
] as const;

test("Cambridge Practice dashboard links all 44 parts and nine full mocks", async ({ page }) => {
  await page.goto("/samples/cambridge");
  await expect(page.getByRole("link", { name: /^Thi thử/ })).toHaveCount(9);
  for (const [label, count] of [["Pre A1 Starters", 13], ["A1 Movers", 15], ["A2 Flyers", 16]] as const) {
    await page.getByRole("link", { name: "Luyện " + label, exact: true }).click();
    await expect(page.locator(".starter-paper-grid ol a")).toHaveCount(count);
    await page.getByRole("link", { name: /Cambridge Practice/ }).click();
  }
  expect((await page.goto(root + "/listening?part=6"))?.status()).toBe(404);
});

for (const part of [1, 2, 3, 4]) {
  test(`Flyers Speaking Part ${part}`, async ({ page }) => {
    await start(page, "speaking?part=" + part);
    await expect(page.getByText("Gợi ý luyện tập")).toBeVisible();
    if (part === 1 || part === 3) {
      await expect(page.locator(".mover-scenes figure")).toHaveCount(part === 1 ? 2 : 4);
      const zoom = button(page, part === 1 ? "Enlarge Picture A" : "Enlarge Picture 1");
      await zoom.click();
      await expect(zoom).toHaveAttribute("aria-pressed", "true");
    }
    if (part === 2) {
      await expect(page.getByText("Tuesday", { exact: true })).toBeVisible();
      await button(page, "Ask the examiner").click();
      await expect(page.getByText("Harbour boat trip", { exact: true })).toBeVisible();
      await expect(page.locator(".flyer-exchange dd").filter({ hasText: /^\?$/ })).toHaveCount(5);
      await expect(page.getByText("Thursday", { exact: true })).toHaveCount(0);
      await button(page, "Answer the examiner").click();
      await expect(page.getByText("11:20 a.m.", { exact: true })).toBeVisible();
    }
    await expect(page.locator("audio, .starter-sheet textarea")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /microphone|ghi âm/ })).toHaveCount(0);
    await finish(page, 1);
    await expect(page.locator(".game-completion strong")).toHaveCount(0);
  });
}

for (const [i, [count, answer]] of reading.entries()) {
  const part = i + 1;
  test(`Flyers Reading & Writing Part ${part}`, async ({ page }) => {
    await start(page, "reading?part=" + part);
    const input = page.getByLabel("Your answer");
    if (part === 2) {
      await expect(page.getByRole("list", { name: "Dialogue" }).getByRole("listitem")).toHaveCount(5);
      await expect(page.locator(".flyer-responses button")).toHaveCount(8);
      await button(page, answer).click();
    } else if (part === 7) {
      await expect(page.locator(".mover-scenes figure")).toHaveCount(3);
      await input.fill("Sam flew a kite near the harbour. It got stuck in a tree, but a friend helped him bring it down.");
      await expect(page.getByText(/21 words/)).toBeVisible();
      await finish(page, 1);
      await expect(page.getByText(/Giáo viên có thể chấm bài viết truyện/)).toBeVisible();
      await expect(page.locator(".game-completion strong")).toHaveCount(0);
      return;
    } else {
      if (part === 1) await expect(page.locator('[aria-label="Word bank"] button')).toHaveCount(15);
      if (part === 6) {
        await expect(page.locator('[aria-label="Word bank"],[aria-label="Answer choices"]')).toHaveCount(0);
        await expect(page.getByText(/Thanks \(1\) ___ your message/)).toBeVisible();
      }
      if ([1, 3, 4].includes(part)) {
        await button(page, answer).click();
        await expect(input).toBeFocused();
        await expect(input).toBeEmpty();
      }
      await input.fill(answer);
    }
    await button(page, "Tiếp theo").click();
    await expect(page.getByText("Mục 1: Chính xác!")).toBeVisible();
    if (part === 2) await expect(button(page, answer)).toBeDisabled();
    if (part === 3) {
      for (let index = 0; index < 4; index++) await button(page, "Tiếp theo").click();
      await button(page, "Saving the kite").click();
      await finish(page, 1);
      await expect(page.getByText("2/6 điểm", { exact: true })).toBeVisible();
      return;
    }
    await finish(page, count - 1);
    await expect(page.getByText(`1/${count} điểm`, { exact: true })).toBeVisible();
  });
}
