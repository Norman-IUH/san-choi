import { test, expect } from "@playwright/test";

test.use({ trace: "off" });

const teacherEmail = process.env.E2E_TEACHER_EMAIL;
const teacherPassword = process.env.E2E_TEACHER_PASSWORD;
const otherEmail = process.env.E2E_OTHER_EMAIL;
const otherPassword = process.env.E2E_OTHER_PASSWORD;

test("teacher saves Quiz, assigns an immutable copy and reads an anonymous submission", async ({ browser, page }, info) => {
  test.skip(info.project.name !== "desktop" || !teacherEmail || !teacherPassword || !otherEmail || !otherPassword,
    "Requires two Supabase test teachers");
  test.setTimeout(90000);
  async function login(target: typeof page, email: string, password: string) {
    await target.goto("/login");
    await target.getByLabel("Email").fill(email);
    await target.getByLabel("Mật khẩu").fill(password);
    await target.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(target.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible();
  }
  await login(page, teacherEmail!, teacherPassword!);
  await page.goto("/activities/new?template=quiz");
  const title = `Quiz kiểm thử ${Date.now()}`;
  await page.getByLabel("Tên hoạt động").fill(title);
  for (let i = 0; i < 10; i++) {
    if (i) await page.getByRole("button", { name: "Thêm mục" }).click();
    const field = page.getByRole("group", { name: `Mục ${i + 1}`, exact: true });
    await field.getByLabel("Câu hỏi hoặc gợi ý").fill(`Câu ${i + 1}`);
    await field.getByLabel("Phương án, mỗi dòng một phương án").fill("Có\nKhông");
    await field.getByLabel("Đáp án đúng, mỗi dòng một đáp án có trong phương án").fill("Có");
  }
  await page.getByRole("button", { name: "Xuất bản" }).click();
  await expect(page.getByRole("button", { name: "Tạo link giao bài" })).toBeVisible();
  const activityUrl = page.url();
  await page.reload();
  await expect(page.getByRole("heading", { name: title }).first()).toBeVisible();

  const outsider = await browser.newPage({ baseURL: info.project.use.baseURL });
  await login(outsider, otherEmail!, otherPassword!);
  await outsider.goto(activityUrl);
  await expect(outsider.getByRole("heading", { name: "Trang không khả dụng" })).toBeVisible();
  await page.getByRole("button", { name: "Tạo link giao bài" }).click();
  const share = page.getByLabel("Link chia sẻ");
  await expect(share).toBeVisible();
  const assignmentUrl = page.url();
  const shareUrl = await share.inputValue();
  await outsider.goto(assignmentUrl);
  await expect(outsider.getByRole("heading", { name: "Trang không khả dụng" })).toBeVisible();
  await outsider.close();

  await page.goto(activityUrl);
  await page.getByRole("link", { name: "Chỉnh sửa" }).click();
  const first = page.getByRole("group", { name: "Mục 1", exact: true });
  await first.getByLabel("Câu hỏi hoặc gợi ý").fill("Nội dung đã sửa sau khi giao");
  await first.getByLabel("Đáp án đúng, mỗi dòng một đáp án có trong phương án").fill("Không");
  await page.getByRole("button", { name: "Xuất bản" }).click();
  await expect(page.getByRole("button", { name: "Tạo link giao bài" })).toBeVisible();

  const student = await browser.newPage();
  await student.goto(shareUrl);
  await student.getByLabel("Biệt danh").fill("Học sinh kiểm thử");
  await student.getByRole("button", { name: "Bắt đầu" }).click();
  await expect(student.getByRole("heading", { name: "Câu 1", exact: true })).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await student.getByRole("button", { name: "Có", exact: true }).click();
    await student.getByRole("button", { name: i === 9 ? "Hoàn thành" : "Tiếp theo" }).click();
  }
  await expect(student.getByText("10/10 điểm")).toBeVisible();
  await page.goto(assignmentUrl);
  await expect(page.getByRole("row").filter({ hasText: "Học sinh kiểm thử" })).toContainText("10/10");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Tải CSV" }).click();
  expect((await download).suggestedFilename()).toBe("ket-qua.csv");
  await page.getByRole("button", { name: "Đóng bài tập", exact: true }).click();
  await expect(page.getByText("Đã đóng", { exact: true })).toBeVisible();
  await student.reload();
  await expect(student.getByText("Bài tập đã đóng hoặc hết hạn.")).toBeVisible();
  await student.close();
});
