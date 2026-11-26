import { expect, test } from "@playwright/test";

test("pair board supports both desk drag and touch selection", async ({ page }, info) => {
  await page.goto("/demo/match-up");
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  const row = page.getByRole("button", { name: "Một đôi", exact: true });
  const target = page.getByRole("group", { name: "Đáp án ghép" }).getByRole("button", { name: "2", exact: true });
  if (info.project.name === "desktop") await row.dragTo(target);
  else { await row.tap(); await target.tap(); }
  await expect(row).toContainText("2");
  const remaining = page.getByRole("button", { name: "Một tá", exact: true });
  await remaining.press("Enter");
  await page.getByRole("group", { name: "Đáp án ghép" }).getByRole("button", { name: "12", exact: true }).press("Enter");
  await expect(remaining).toContainText("12");
  if (info.project.name !== "desktop") {
    const source = page.getByRole("button", { name: "Nửa chục", exact: true });
    const destination = page.getByRole("button", { name: "5", exact: true });
    const from = (await source.boundingBox())!;
    const to = (await destination.boundingBox())!;
    const device = await page.context().newCDPSession(page);
    await device.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from.x + from.width / 2, y: from.y + from.height / 2 }] });
    await device.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: to.x + to.width / 2, y: to.y + to.height / 2 }] });
    await device.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(source).toContainText("5");
  }
});

test("wheel uses actual labels and motion honors user preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/wheel");
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  const labels = await page.locator(".wheel-caption").allTextContents();
  expect(labels).toHaveLength(3);
  const spin = page.getByRole("button", { name: "Quay vòng" });
  await spin.click();
  const prompt = await page.locator(".wheel-prompt h2").innerText();
  expect(labels).toContain(prompt);
  await expect(page.locator(".wheel-disc")).toHaveCSS("transition-duration", "0s");
});

test("classroom controls and incorrect answer review", async ({ page }) => {
  await page.goto("/demo/quiz");
  await page.getByRole("button", { name: "Âm thanh phản hồi" }).click();
  await expect(page.getByRole("button", { name: "Âm thanh phản hồi" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Toàn màn hình", exact: true }).click();
  await expect(page.getByRole("button", { name: "Thoát toàn màn hình" })).toBeVisible();
  await page.getByRole("button", { name: "Thoát toàn màn hình" }).click();
  await expect(page.getByRole("button", { name: "Toàn màn hình", exact: true })).toBeVisible();
  await page.locator(".game-stage").evaluate(element => Object.defineProperty(element, "requestFullscreen", { value: undefined }));
  await page.getByRole("button", { name: "Toàn màn hình", exact: true }).click();
  await expect(page.locator(".classroom-fallback")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".classroom-fallback")).toHaveCount(0);
  await page.getByRole("button", { name: "Bắt đầu" }).click();
  await page.getByRole("button", { name: "Sao Kim", exact: true }).click();
  await page.getByRole("button", { name: "Tiếp theo" }).click();
  await page.getByRole("button", { name: "Mặt Trời", exact: true }).click();
  await page.getByRole("button", { name: "Đèn đang sáng", exact: true }).click();
  await page.getByRole("button", { name: "Tiếp theo" }).click();
  await page.getByRole("button", { name: "Sao Thủy", exact: true }).click();
  await page.getByRole("button", { name: "Hoàn thành", exact: true }).click();
  await expect(page.getByText("2/3 điểm", { exact: true })).toBeVisible();
  await page.getByText("Xem lại câu sai (1)", { exact: true }).click();
  await expect(page.getByText("Đáp án Sao Hỏa", { exact: true })).toBeVisible();
});
