import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { arcadeTemplates, hasArcadeCanvas, type ArcadeTemplate } from "../../lib/games/arcade-templates";
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
    const checksCanvasMedia = template === "maze-chase";
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
      if (index === 0 && checksCanvasMedia) {
        await field.getByText("Học liệu tiếng Anh và tệp", { exact: true }).click();
        const option = field.locator("details").filter({ has: page.locator("summary", { hasText: "Tệp cho phương án " + item.options[0] }) }).last();
        await option.locator("summary").click();
        const buffer = await sharp({ create: { width: 24, height: 24, channels: 3, background: "#287456" } }).png().toBuffer();
        await option.getByLabel("Ảnh phương án", { exact: true }).setInputFiles({ name: "arcade.png", mimeType: "image/png", buffer });
        await expect(option.getByRole("img", { name: "Ảnh phương án" })).toBeVisible();
      }
    }
    await page.getByRole("button", { name: "Xuất bản" }).click();
    await expect(page.getByRole("button", { name: "Tạo link giao bài" })).toBeVisible({ timeout: 45000 });
    await page.getByRole("button", { name: "Bắt đầu" }).click();
    await expect(page.locator(hasArcadeCanvas(template) ? ".arcade-field [data-ready=true] canvas" : ".arcade-field")).toBeVisible();
    const tomorrowInVietnam = new Date(Date.now() + 31 * 3600000).toISOString().slice(0, 16);
    await page.getByLabel("Hạn nộp (giờ Việt Nam)").fill(tomorrowInVietnam);
    await page.getByRole("button", { name: "Tạo link giao bài" }).click();
    const share = page.getByLabel("Link chia sẻ");
    await expect(share).toBeVisible({ timeout: 45000 });
    await expect(page.getByText(/^Hạn nộp /)).toBeVisible();
    const student = await browser.newPage({ reducedMotion: "reduce" });
    try {
      await student.goto(await share.inputValue(), { waitUntil: "networkidle" });
      await student.getByLabel("Biệt danh").fill("Kiểm thử V1.4C");
      let expiredImage = "";
      let freshImageLoaded = false;
      if (checksCanvasMedia) await student.route(url => url.pathname.includes("/object/sign/"), async route => {
        const url = route.request().url();
        if (!expiredImage || expiredImage === url) {
          expiredImage = url;
          return route.fulfill({ status: 400, body: "Expired URL" });
        }
        const response = await route.fetch();
        freshImageLoaded = response.ok();
        await route.fulfill({ response });
      });
      await student.getByRole("button", { name: "Bắt đầu" }).click();
      await expect(student.getByRole("timer")).toBeVisible({ timeout: 45000 });
      if (checksCanvasMedia) await expect.poll(() => freshImageLoaded, { timeout: 25000 }).toBe(true);
      const isRisk = template === "win-or-lose-quiz";
      let dropped = false;
      if (isRisk) await student.route("**/play/**", async route => {
        if (dropped || route.request().method() !== "POST") return route.continue();
        const response = await route.fetch();
        dropped = response.ok();
        await route.abort("internetdisconnected");
      });
      await playArcade(student, template, items, template === "speed-sorting" ? async () => {
        await expect(student.getByRole("progressbar", { name: "Mục 2 / 2" })).toBeVisible();
        await student.reload();
        await student.getByLabel("Biệt danh").fill("Kiểm thử V1.4C");
        await student.getByRole("button", { name: "Bắt đầu" }).click();
      } : undefined);
      if (isRisk) {
        await expect(student.getByText("Mất kết nối. Bạn có thể thử nộp lại.", { exact: true })).toBeVisible({ timeout: 35000 });
        expect(dropped).toBe(true);
        await student.getByRole("button", { name: "Hoàn thành" }).click();
      }
      const score = template === "win-or-lose-quiz" ? "2/3" : "1/2";
      await expect(student.getByText(score + " điểm", { exact: true })).toBeVisible({ timeout: 35000 });
      await page.reload();
      const row = page.getByRole("row").filter({ hasText: "Kiểm thử V1.4C" });
      await expect(row).toHaveCount(1);
      await expect(row).toContainText(score);
    } finally {
      await student.close();
      await page.getByRole("button", { name: "Đóng bài tập" }).click();
      await expect(page.getByText("Đã đóng", { exact: true })).toBeVisible({ timeout: 45000 });
    }
  });
}
