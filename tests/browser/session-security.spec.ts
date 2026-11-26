import { expect, test } from "@playwright/test";

test.use({ trace: "off" });

test("assignment retries a lost submission without duplicating or changing the wrong score", async ({ page, browser }, info) => {
  const email = process.env.E2E_TEACHER_EMAIL;
  const password = process.env.E2E_TEACHER_PASSWORD;
  test.skip(info.project.name !== "desktop" || !email || !password, "Requires QuizStudy test teacher");
  test.setTimeout(170000);
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Mật khẩu").fill(password!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible({ timeout: 45000 });
  await page.goto("/activities/new?template=quiz");
  await page.getByLabel("Tên hoạt động").fill("[TEST V1.4A] Network retry");
  await page.getByLabel("Câu hỏi hoặc gợi ý").fill("Choose the correct answer.");
  await page.getByLabel("Phương án, mỗi dòng một phương án").fill("Right\nWrong");
  await page.getByLabel("Đáp án đúng, mỗi dòng một đáp án có trong phương án").fill("Right");
  await page.getByRole("button", { name: "Xuất bản" }).click();
  await expect(page.getByRole("button", { name: "Tạo link giao bài" })).toBeVisible({ timeout: 45000 });
  await page.getByRole("button", { name: "Tạo link giao bài" }).click();
  const share = page.getByLabel("Link chia sẻ");
  await expect(share).toBeVisible({ timeout: 45000 });
  const student = await browser.newPage();
  try {
    await student.goto(await share.inputValue(), { waitUntil: "networkidle" });
    await student.getByLabel("Biệt danh").fill("Kiểm thử mất mạng");
    await student.getByRole("button", { name: "Bắt đầu" }).click();
    await student.getByRole("button", { name: "Wrong", exact: true }).click({ timeout: 35000 });
    let lost = false;
    await student.route("**/play/**", async route => {
      if (lost || route.request().method() !== "POST") return route.continue();
      const server = await route.fetch();
      lost = server.ok();
      await route.abort("internetdisconnected");
    });
    await student.getByRole("button", { name: "Hoàn thành" }).click();
    await expect(student.getByText("Mất kết nối. Bạn có thể thử nộp lại.", { exact: true })).toBeVisible({ timeout: 35000 });
    expect(lost).toBe(true);
    await student.getByRole("button", { name: "Right", exact: true }).click();
    await student.getByRole("button", { name: "Hoàn thành" }).click();
    await expect(student.getByText("0/1 điểm", { exact: true })).toBeVisible({ timeout: 35000 });
    await page.reload();
    const rows = page.getByRole("row").filter({ hasText: "Kiểm thử mất mạng" });
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("0/1");
  } finally {
    await student.close();
    await page.getByRole("button", { name: "Đóng bài tập" }).click();
    await expect(page.getByText("Đã đóng", { exact: true })).toBeVisible({ timeout: 35000 });
  }
});
