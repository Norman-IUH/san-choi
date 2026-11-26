import { expect, test } from "@playwright/test";
import { arcadeTemplates, type ArcadeTemplate } from "../../lib/games/arcade-templates";
import { demoContent } from "../../lib/demo";
import { playArcade } from "./play-arcade";

test.use({ trace: "off" });

for (const template of Object.keys(arcadeTemplates) as ArcadeTemplate[]) {
  test(template + " creates a timed option and stores the server graded result on QuizStudy", async ({ page, browser }, info) => {
    const email = process.env.E2E_TEACHER_EMAIL;
    const password = process.env.E2E_TEACHER_PASSWORD;
    test.skip(info.project.name !== "desktop" || !email || !password, "Requires QuizStudy test teacher");
    test.setTimeout(200000);
    const items = demoContent(template);
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Mật khẩu").fill(password!);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible({ timeout: 45000 });
    await page.goto("/activities/new?template=" + template);
    await page.getByLabel("Tên hoạt động").fill("[TEST V1.4C] " + template);
    for (const [index, item] of items.entries()) {
      if (index > 0) await page.getByRole("button", { name: "Thêm mục" }).click();
      const field = page.getByRole("group", { name: "Mục " + (index + 1) });
      await field.getByLabel("Câu hỏi hoặc gợi ý").fill(item.prompt);
      await field.getByLabel("Phương án, mỗi dòng một phương án").fill(item.options.join("\n"));
      await field.getByLabel("Đáp án đúng, mỗi dòng một đáp án có trong phương án").fill(item.answers[0]);
      if (index === 0) await field.getByRole("checkbox", { name: "Giới hạn thời gian mục này" }).check();
    }
    await page.getByRole("button", { name: "Xuất bản" }).click();
    await expect(page.getByRole("button", { name: "Tạo link giao bài" })).toBeVisible({ timeout: 45000 });
    await page.getByRole("button", { name: "Bắt đầu" }).click();
    await expect(page.locator(".arcade-field canvas")).toBeVisible();
    await page.getByRole("button", { name: "Tạo link giao bài" }).click();
    const share = page.getByLabel("Link chia sẻ");
    await expect(share).toBeVisible({ timeout: 45000 });
    const student = await browser.newPage({ reducedMotion: "reduce" });
    try {
      await student.goto(await share.inputValue(), { waitUntil: "networkidle" });
      await student.getByLabel("Biệt danh").fill("Kiểm thử V1.4C");
      await student.getByRole("button", { name: "Bắt đầu" }).click();
      await expect(student.getByRole("timer")).toBeVisible({ timeout: 45000 });
      await playArcade(student, template, items);
      await expect(student.getByText("1/2 điểm", { exact: true })).toBeVisible({ timeout: 35000 });
      await page.reload();
      await expect(page.getByRole("row").filter({ hasText: "Kiểm thử V1.4C" })).toContainText("1/2");
    } finally {
      await student.close();
      await page.getByRole("button", { name: "Đóng bài tập" }).click();
      await expect(page.getByText("Đã đóng", { exact: true })).toBeVisible({ timeout: 45000 });
    }
  });
}
