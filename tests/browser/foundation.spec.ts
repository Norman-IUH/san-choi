import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("Quiz maintains focus, labels progress and announces practice feedback", async ({ page }, info) => {
  await page.goto("/demo/quiz");
  await expect(page).toHaveTitle("Khám phá hệ Mặt Trời | Sân Chơi");
  const start = page.getByRole("button", { name: "Bắt đầu" });
  if (info.project.name === "desktop") await start.press("Enter");
  else await start.tap();
  await expect(page.getByRole("heading", { name: /hành tinh đỏ/i })).toBeFocused();
  await expect(page.getByRole("progressbar", { name: "Mục 1 / 3" })).toBeVisible();
  const single = page.getByRole("group", { name: "Chọn một đáp án." });
  await single.getByRole("button", { name: "Sao Hỏa" }).click();
  await single.getByRole("button", { name: "Sao Kim" }).click();
  await expect(single.getByRole("button", { pressed: true })).toHaveAccessibleName("Sao Kim");
  await page.getByRole("button", { name: "Tiếp theo" }).press("Enter");
  await expect(page.getByRole("heading", { name: /phát ra ánh sáng/i })).toBeFocused();
  await expect(page.getByRole("status")).toHaveText("Mục 1: Chưa chính xác.");
  const multiple = page.getByRole("group", { name: "Chọn tất cả đáp án đúng." });
  await multiple.getByRole("button", { name: "Mặt Trời", exact: true }).click();
  await multiple.getByRole("button", { name: "Đèn đang sáng" }).click();
  await expect(multiple.getByRole("button", { pressed: true })).toHaveCount(2);
  const screenshots = process.env.V11_SCREENSHOTS;
  if (screenshots) {
    await mkdir(screenshots, { recursive: true });
    await page.screenshot({ path: `${screenshots}/quiz-${info.project.name}.png`, fullPage: true });
  }
});

test("navigation, title, favicon and missing-route status", async ({ page, request }, info) => {
  await page.goto("/login?mode=register");
  await expect(page).toHaveTitle("Tạo tài khoản | Sân Chơi");
  if (info.project.name === "mobile") {
    const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
    for (const link of await nav.getByRole("link").all()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  expect((await request.get("/favicon.ico")).status()).toBe(200);
  for (const path of ["/audit-missing-page", "/demo/missing", "/play/invalid", "/resource/invalid"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
    await expect(page.getByRole("heading", { name: "Trang không khả dụng" })).toBeVisible();
  }
});

test("community describes unavailable backend", async ({ page }, info) => {
  test.skip(process.env.E2E_EXPECT_UNCONFIGURED !== "1", "Requires a server without Supabase settings");
  await page.goto("/community");
  await expect(page.getByRole("status")).toContainText("cần kết nối máy chủ");
  await expect(page.getByRole("heading", { name: "Chưa tìm thấy hoạt động công khai" })).toHaveCount(0);
  const screenshots = process.env.V11_SCREENSHOTS;
  if (screenshots) {
    await mkdir(screenshots, { recursive: true });
    await page.screenshot({ path: `${screenshots}/community-${info.project.name}.png`, fullPage: true });
  }
});
