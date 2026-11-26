import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

test.use({ trace: "off" });

test("teacher imports and uploads vocabulary, then the student receives the saved snapshot", async ({ page, browser }, info) => {
  const email = process.env.E2E_TEACHER_EMAIL;
  const password = process.env.E2E_TEACHER_PASSWORD;
  test.skip(!email || !password || info.project.name !== "desktop", "Requires a Supabase development teacher");
  test.setTimeout(90000);

  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Mật khẩu").fill(password!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible({ timeout: 25000 });
  await page.goto("/activities/new?template=flash-cards");
  const title = `V1.2 Vocabulary ${Date.now()}`;
  await page.getByLabel("Tên hoạt động").fill(title);
  const upload = page.getByLabel("Nhập từ vựng CSV hoặc XLSX");
  await upload.setInputFiles("tests/fixtures/vocabulary.xlsx");
  const first = page.getByRole("group", { name: "Mục 1", exact: true });
  await expect(first.getByLabel("Mặt trước / nội dung")).toHaveValue("bridge");
  await upload.setInputFiles({ name: "vocabulary.csv", mimeType: "text/csv",
    buffer: Buffer.from("word,meaning,level,example\ngarden,khu vườn,A1 Movers,We like our garden.") });
  await expect(page.getByRole("group", { name: "Mục 2", exact: true }).getByLabel("Mặt trước / nội dung")).toHaveValue("garden");
  await first.getByText("Học liệu tiếng Anh và tệp", { exact: true }).click();
  await expect(first.getByLabel("IPA", { exact: true })).toHaveValue("/brɪdʒ/");
  const image = first.getByLabel("Ảnh câu hỏi", { exact: true });
  await image.setInputFiles({ name: "fake.png", mimeType: "image/png", buffer: Buffer.from("not a valid image") });
  await expect(first.getByRole("alert")).toHaveText("Định dạng tệp không phù hợp.");
  const png = await sharp({ create: { width: 24, height: 24, channels: 3, background: "#5736cc" } }).png().toBuffer();
  await image.setInputFiles({ name: "bridge.png", mimeType: "image/png", buffer: png });
  const preview = first.getByRole("img", { name: "Ảnh câu hỏi" });
  await expect(preview).toBeVisible();
  await expect.poll(() => preview.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBe(24);
  const screenshots = process.env.V12_SCREENSHOTS;
  if (screenshots) {
    await mkdir(screenshots, { recursive: true });
    await page.screenshot({ path: `${screenshots}/english-editor-desktop.png`, fullPage: true });
  }
  await page.getByRole("button", { name: "Xuất bản" }).click();
  await expect(page.getByRole("button", { name: "Tạo link giao bài" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Tạo link giao bài" }).click();
  const share = page.getByLabel("Link chia sẻ");
  await expect(share).toBeVisible();
  const student = await browser.newPage();
  try {
    await student.goto(await share.inputValue());
    await student.getByLabel("Biệt danh").fill("Kiểm thử nội dung V1.2");
    await student.getByRole("button", { name: "Bắt đầu" }).click();
    const asset = student.getByRole("img", { name: "bridge" });
    await expect.poll(() => asset.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBe(24);
    const privatePath = new URL((await asset.getAttribute("src"))!);
    privatePath.pathname = privatePath.pathname.replace("/object/sign/", "/object/public/");
    privatePath.search = "";
    expect((await student.request.get(privatePath.href)).ok()).toBe(false);
    await student.getByRole("button", { name: /bridge/ }).click();
    await expect(student.getByText("We crossed the bridge.", { exact: true })).toBeVisible();
    await student.getByRole("button", { name: "Tiếp theo" }).click();
    await student.getByRole("button", { name: "Hoàn thành" }).click();
    await expect(student.getByText("Bài làm đã được lưu.")).toBeVisible();
  } finally {
    await student.close();
  }
});
