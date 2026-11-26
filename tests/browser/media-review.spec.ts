import { expect, test } from "@playwright/test";
import sharp from "sharp";

test.use({ trace: "off" });

test("quiz options and both pronunciations survive assignment snapshot with opt-in review", async ({ page, browser }, info) => {
  const email = process.env.E2E_TEACHER_EMAIL;
  const password = process.env.E2E_TEACHER_PASSWORD;
  test.skip(!email || !password || info.project.name !== "desktop", "Requires the development teacher");
  test.setTimeout(240000);
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Mật khẩu").fill(password!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible({ timeout: 25000 });
  await page.goto("/activities/new?template=quiz");
  await page.getByLabel("Tên hoạt động").fill("[TEST V1.3] Pronunciation and review");
  await page.getByLabel("Câu hỏi hoặc gợi ý").fill("Choose the pencil.");
  await page.getByLabel("Phương án, mỗi dòng một phương án").fill("Pencil\nEraser");
  await page.getByLabel("Đáp án đúng, mỗi dòng một đáp án có trong phương án").fill("Pencil");
  await page.getByText("Học liệu tiếng Anh và tệp", { exact: true }).click();
  for (const [label, accent] of [["Anh–Anh", "uk"], ["Anh–Mỹ", "us"]]) {
    await page.getByLabel("Phát âm " + label, { exact: true }).setInputFiles(`public/audio/vocabulary/pencil-${accent}.wav`);
    await expect(page.locator(`audio[aria-label="Phát âm ${label}"]`)).toBeVisible({ timeout: 15000 });
  }
  const eraser = page.locator("details").filter({ has: page.locator("summary", { hasText: /^Tệp cho phương án Eraser$/ }) }).last();
  await eraser.locator("summary").click();
  const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: "#f2a59f" } }).png().toBuffer();
  await eraser.getByLabel("Ảnh phương án", { exact: true }).setInputFiles({ name: "eraser.png", mimeType: "image/png", buffer: png });
  await expect(eraser.getByRole("img", { name: "Ảnh phương án" })).toBeVisible({ timeout: 15000 });
  await eraser.getByLabel("Âm thanh phương án", { exact: true }).setInputFiles("public/audio/vocabulary/eraser-us.wav");
  await expect(eraser.locator('audio[aria-label="Âm thanh phương án"]')).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Thêm mục" }).click();
  const second = page.getByRole("group", { name: "Mục 2" });
  await second.getByLabel("Câu hỏi hoặc gợi ý").fill("Choose the ruler.");
  await second.getByLabel("Phương án, mỗi dòng một phương án").fill("Ruler\nBook");
  await second.getByLabel("Đáp án đúng, mỗi dòng một đáp án có trong phương án").fill("Ruler");
  await page.getByRole("button", { name: "Xuất bản" }).click();
  await expect(page.getByRole("button", { name: "Tạo link giao bài" })).toBeVisible({ timeout: 60000 });
  const activityUrl = page.url();
  for (const showReview of [false, true]) {
    await page.goto(activityUrl);
    if (showReview) await page.getByRole("checkbox", { name: "Cho học sinh xem câu sai và đáp án sau khi nộp" }).check();
    await page.getByRole("button", { name: "Tạo link giao bài" }).click();
    const share = page.getByLabel("Link chia sẻ");
    await expect(share).toBeVisible({ timeout: 45000 });
    const student = await browser.newPage();
    try {
      await student.goto(await share.inputValue());
      await student.getByLabel("Biệt danh").fill("Kiểm thử media");
      await student.getByRole("button", { name: "Bắt đầu" }).click();
      const option = student.getByRole("button", { name: "Eraser", exact: true });
      await expect.poll(() => option.locator("img").evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(20);
      const tracks: string[] = [];
      for (const label of ["Anh–Anh", "Anh–Mỹ", "Nghe phương án Eraser"]) {
        const source = await student.locator(`audio[aria-label="${label}"]`).getAttribute("src");
        expect(source).toBeTruthy();
        tracks.push(source!);
        const response = await student.request.get(source!);
        expect((await response.body()).subarray(0, 4).toString()).toBe("RIFF");
      }
      expect(new Set(tracks).size).toBe(3);
      await option.click();
      await student.getByRole("button", { name: "Tiếp theo" }).click();
      await expect(student.getByRole("progressbar", { name: "Mục 2 / 2" })).toBeVisible();
      await student.reload();
      await student.getByLabel("Biệt danh").fill("Kiểm thử media");
      await student.getByRole("button", { name: "Bắt đầu" }).click();
      await expect(student.getByRole("progressbar", { name: "Mục 2 / 2" })).toBeVisible({ timeout: 45000 });
      await student.getByRole("button", { name: "Ruler", exact: true }).click();
      await student.getByRole("button", { name: "Hoàn thành" }).click();
      await expect(student.getByText("1/2 điểm", { exact: true })).toBeVisible({ timeout: 45000 });
      const review = student.getByText("Xem lại câu sai (1)", { exact: true });
      if (showReview) {
        await review.click();
        await expect(student.getByText("Đáp án Pencil", { exact: true })).toBeVisible();
      } else await expect(review).toHaveCount(0);
    } finally {
      await student.close();
    }
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("row").filter({ hasText: "Kiểm thử media" })).toContainText("1/2");
    await page.getByRole("button", { name: "Đóng bài tập", exact: true }).click();
    await expect(page.getByRole("button", { name: "Mở lại bài tập" })).toBeVisible({ timeout: 45000 });
  }
});
