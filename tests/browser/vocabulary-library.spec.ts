import { mkdir, readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import { starterLessons, vocabularyCatalog } from "../../lib/vocabulary-catalog";

test.use({ trace: "off" });

async function signIn(page: Page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(process.env.E2E_TEACHER_EMAIL!);
  await page.getByLabel("Mật khẩu").fill(process.env.E2E_TEACHER_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible({ timeout: 45000 });
}

function requiresTeacher() {
  test.skip(!process.env.E2E_TEACHER_EMAIL || !process.env.E2E_TEACHER_PASSWORD, "Requires a QuizStudy test teacher");
}

for (const starter of starterLessons) {
  test(starter.level + " reuses a lesson in two templates and saves a real assignment score", async ({ page, browser }, info) => {
    requiresTeacher();
    test.skip(info.project.name !== "desktop", "One hosted publication per level");
    test.setTimeout(150000);
    await signIn(page);
    await page.goto("/library?starter=" + starter.id);
    const title = "[TEST V1.5A] " + starter.title;
    await page.getByLabel("Tên bài học").fill(title);
    await expect(page.getByText("Đã chọn 5/60", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Lưu bài học", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Trò chơi từ bài học" })).toBeVisible();
    const lessonUrl = page.url();
    await page.getByRole("button", { name: "Bắt đầu", exact: true }).click();
    await expect(page.locator('audio[aria-label="Anh–Anh"]')).toBeVisible();
    await expect(page.locator('audio[aria-label="Anh–Mỹ"]')).toBeVisible();
    await page.getByLabel("Mẫu trò chơi").selectOption("quiz");
    await page.getByRole("button", { name: "Xem trước", exact: true }).click();
    await page.getByRole("button", { name: "Tạo bản soạn từ mẫu này" }).click();
    await expect(page.getByLabel("Tên hoạt động")).toHaveValue(title);
    await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
    await page.getByRole("button", { name: "Bắt đầu", exact: true }).click();
    await expect(page.getByRole("progressbar", { name: "Mục 1 / 5" })).toBeVisible();
    await page.getByRole("button", { name: "Tạo link giao bài" }).click();
    const share = page.getByLabel("Link chia sẻ");
    await expect(share).toBeVisible({ timeout: 30000 });
    const assignmentUrl = page.url();
    const playUrl = await share.inputValue();
    const words = starter.keys.map(key => vocabularyCatalog.find(word => word.id === key)!);
    if (starter.id === "kids") {
      await page.goto(lessonUrl);
      await page.getByRole("link", { name: "Sửa bài học", exact: true }).click();
      await page.getByRole("button", { name: "Bỏ chọn " + words[0].word, exact: true }).click();
      await page.getByRole("button", { name: "Lưu bài học", exact: true }).click();
      await expect(page.getByText(/· 4 từ$/)).toBeVisible();
    }
    const student = await browser.newPage();
    try {
      await student.goto(playUrl);
      await student.getByLabel("Biệt danh").fill("Kiểm thử V1.5A");
      await student.getByRole("button", { name: "Bắt đầu", exact: true }).click();
      await expect(student.getByRole("progressbar", { name: "Mục 1 / 5" })).toBeVisible();
      for (const [turn, word] of words.entries()) {
        await student.getByRole("button", { name: turn === 0 ? words[1].word : word.word, exact: true }).click();
        await student.getByRole("button", { name: turn === 4 ? "Hoàn thành" : "Tiếp theo", exact: true }).click();
      }
      await expect(student.getByText("4/5 điểm", { exact: true })).toBeVisible({ timeout: 35000 });
      await expect(student.getByText("Xem lại câu sai (1)", { exact: true })).toHaveCount(0);
      await page.goto(assignmentUrl);
      await expect(page.getByRole("row").filter({ hasText: "Kiểm thử V1.5A" })).toContainText("4/5");
    } finally {
      await student.close();
      await page.goto(assignmentUrl);
      await page.getByRole("button", { name: "Đóng bài tập", exact: true }).click();
      await expect(page.getByText("Đã đóng", { exact: true })).toBeVisible();
    }
  });
}

test("teacher imports CSV/XLSX, edits media, updates a selection and exports the real vocabulary bank", async ({ page }, info) => {
  requiresTeacher();
  test.skip(info.project.name !== "desktop", "One hosted media fixture");
  test.setTimeout(125000);
  await signIn(page);
  for (const file of [
    { name: "bank.csv", mimeType: "text/csv", buffer: Buffer.from("word,meaning,part,ipa\nseedling demo,cây con,noun,/ˈsiːdlɪŋ/") },
    "tests/fixtures/vocabulary.xlsx",
  ]) {
    await page.goto("/library");
    await page.getByText("Nhập CSV hoặc XLSX", { exact: true }).click();
    await page.getByLabel("Tệp từ vựng").setInputFiles(file);
    await page.getByLabel("Chủ đề mặc định").fill("Thử nhập bảng từ");
    await page.getByRole("button", { name: "Nhập từ vựng", exact: true }).click();
    await expect(page.getByText(/Đã nhập từ mới/)).toBeVisible();
  }
  await page.getByLabel("Tìm từ hoặc nghĩa").fill("seedling demo");
  await page.getByRole("link", { name: "Sửa seedling demo" }).click();
  await page.getByText("Ảnh và phát âm", { exact: true }).click();
  await page.getByLabel("Ảnh từ vựng").setInputFiles({ name: "plant.png", mimeType: "image/png",
    buffer: await sharp({ create: { width: 24, height: 24, channels: 3, background: "#3a8765" } }).png().toBuffer() });
  await page.getByLabel("Phát âm Anh–Anh", { exact: true }).setInputFiles("public/audio/vocabulary/book-uk.wav");
  await expect(page.getByRole("img", { name: "Ảnh từ vựng" })).toBeVisible();
  await expect(page.locator('audio[aria-label="Phát âm Anh–Anh"]')).toBeVisible();
  await page.getByRole("button", { name: "Lưu từ vựng", exact: true }).click();
  await expect(page.getByText("Đã lưu từ vựng.", { exact: true })).toBeVisible();
  await page.getByLabel("Tìm từ hoặc nghĩa").fill("seedling demo");
  await page.getByRole("link", { name: "Sửa seedling demo" }).click();
  await page.getByText("Ảnh và phát âm", { exact: true }).click();
  const src = (await page.getByRole("img", { name: "Ảnh từ vựng" }).getAttribute("src"))!;
  expect((await page.request.get(src)).ok()).toBe(true);
  const unsigned = new URL(src);
  unsigned.pathname = unsigned.pathname.replace("/object/sign/", "/object/public/");
  unsigned.search = "";
  expect((await page.request.get(unsigned.toString())).ok()).toBe(false);
  await page.goto("/library");
  await page.getByLabel("Tìm từ hoặc nghĩa").fill("seedling demo");
  await page.getByRole("checkbox", { name: /seedling demo/ }).check();
  await page.getByText("Sửa hàng loạt từ riêng", { exact: true }).click();
  await page.getByLabel("Chủ đề mới").fill("Cây và vườn");
  await page.getByRole("button", { name: "Cập nhật từ đã chọn" }).click();
  await expect(page.getByText("Đã lưu từ vựng.", { exact: true })).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Tải CSV" }).click()]);
  const exported = await readFile((await download.path())!, "utf8");
  expect(exported.split("\r\n").length).toBeGreaterThan(440);
  expect(exported.includes('"seedling demo","cây con","Kids","Cây và vườn"')).toBe(true);
  expect(exported.includes("token=")).toBe(false);
  await page.getByLabel("Tìm từ hoặc nghĩa").fill("seedling demo");
  await page.getByRole("checkbox", { name: /seedling demo/ }).check();
  await page.getByLabel("Tên bài học").fill("[TEST B1] Archive reference");
  await page.getByLabel("Chủ đề bài học").fill("Cây và vườn");
  await page.getByLabel("Unit", { exact: true }).fill("Unit 1");
  await page.getByRole("button", { name: "Lưu bài học", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Trò chơi từ bài học" })).toBeVisible();
  const lessonUrl = page.url();
  await page.goto("/library");
  await page.getByLabel("Tìm từ hoặc nghĩa").fill("seedling demo");
  await page.getByRole("link", { name: "Sửa seedling demo" }).click();
  await page.getByRole("button", { name: "Lưu trữ từ", exact: true }).click();
  await page.getByLabel("Tìm từ hoặc nghĩa").fill("seedling demo");
  await expect(page.getByText("Không tìm thấy từ phù hợp.")).toBeVisible();
  await page.getByRole("combobox", { name: "Nguồn", exact: true }).selectOption("archived");
  await expect(page.getByRole("checkbox", { name: /seedling demo/ })).toBeDisabled();
  await page.goto(lessonUrl);
  await page.getByRole("button", { name: "Bắt đầu", exact: true }).click();
  await expect(page.getByRole("button", { name: /seedling demo/ })).toBeVisible();
});

test("library search and level filters fit desktop and touch profiles", async ({ page }, info) => {
  requiresTeacher();
  await signIn(page);
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Ngân hàng từ vựng" })).toBeVisible();
  const screenshots = process.env.V15_SCREENSHOTS;
  if (screenshots) {
    await mkdir(screenshots, { recursive: true });
    await page.screenshot({ path: `${screenshots}/library-${info.project.name}.png`, animations: "disabled", fullPage: true });
  }
  const bank = page.getByRole("region", { name: "Ngân hàng từ vựng" });
  await bank.getByRole("combobox", { name: "Cấp độ", exact: true }).selectOption("A2 Flyers");
  await bank.getByRole("combobox", { name: "Chủ đề", exact: true }).selectOption("Technology");
  await page.getByLabel("Tìm từ hoặc nghĩa").fill("screen");
  await expect(page.getByRole("checkbox", { name: /screen/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});
