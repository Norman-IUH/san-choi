import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { deckIds, englishDecks } from "../../lib/english-samples";

test("four English decks can be previewed in two templates", async ({ page }, info) => {
  await page.goto("/samples");
  for (const id of deckIds) await expect(page.getByRole("link", { name: new RegExp(englishDecks[id].level) })).toBeVisible();
  const screenshots = process.env.V12_SCREENSHOTS;
  if (screenshots) {
    await mkdir(screenshots, { recursive: true });
    await page.screenshot({ path: `${screenshots}/english-library-${info.project.name}.png`, fullPage: true });
  }
  for (const id of deckIds) {
    const deck = englishDecks[id];
    await page.goto(`/samples/${id}`);
    await page.getByRole("button", { name: "Bắt đầu" }).click();
    for (const label of ["Anh–Anh", "Anh–Mỹ"]) {
      const src = await page.locator(`audio[aria-label="${label}"]`).getAttribute("src");
      expect(src).toBeTruthy();
      const response = await page.request.get(new URL(src!, page.url()).href);
      expect(response.status()).toBe(200);
      expect((await response.body()).subarray(0, 4).toString()).toBe("RIFF");
    }
    await page.getByRole("button", { name: new RegExp(deck.entries[0][0], "i") }).click();
    await expect(page.getByText(deck.entries[0][3], { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Ghép cặp", exact: true }).click();
    await page.getByRole("button", { name: "Bắt đầu" }).click();
    for (const [word, meaning] of deck.entries) {
      await page.getByRole("group", { name: "Thẻ cần ghép" }).getByRole("button", { name: word, exact: true }).click();
      await page.getByRole("group", { name: "Đáp án ghép" }).getByRole("button", { name: meaning, exact: true }).click();
    }
    await page.getByRole("button", { name: "Hoàn thành" }).click();
    await expect(page.getByText(`${deck.entries.length}/${deck.entries.length} điểm`)).toBeVisible();
  }
});

test("single teacher mode removes signup navigation", async ({ page }) => {
  test.skip(process.env.E2E_SINGLE_TEACHER !== "1", "Requires a server configured in single teacher mode");
  await page.goto("/login?mode=register");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tạo tài khoản" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tiếp tục với Google" })).toHaveCount(0);
});
