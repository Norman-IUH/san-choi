import { expect, test } from "@playwright/test";
import { demoContent } from "../../lib/demo";
import { puzzleTemplates, type PuzzleTemplate } from "../../lib/games/puzzle-templates";
import { solvePuzzle } from "./solve-puzzle";

test.use({ trace: "off" });

for (const template of Object.keys(puzzleTemplates) as PuzzleTemplate[]) {
  test(template + " uses real teacher editor and persists the student's result", async ({ page, browser }, info) => {
    const email = process.env.E2E_TEACHER_EMAIL;
    const password = process.env.E2E_TEACHER_PASSWORD;
    test.skip(info.project.name !== "desktop" || !email || !password, "Requires a test teacher on QuizStudy");
    test.setTimeout(270000);
    const items = demoContent(template);
    const { kind, title } = puzzleTemplates[template];
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Mật khẩu").fill(password!);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible({ timeout: 45000 });
    await page.goto("/activities/new?template=" + template);
    await page.getByLabel("Tên hoạt động").fill("[TEST V1.4B] " + title);
    for (const [index, item] of items.entries()) {
      if (index > 0) await page.getByRole("button", { name: "Thêm mục" }).click();
      const entry = page.getByRole("group", { name: "Mục " + (index + 1) });
      await entry.getByLabel(kind === "pair" ? "Mặt trước / nội dung" : "Câu hỏi hoặc gợi ý").fill(item.prompt);
      if (template === "maths-generator") {
        await entry.getByRole("combobox", { name: "Phép tính", exact: true }).selectOption(item.math!.operation);
        await entry.getByLabel("Số nhỏ nhất").fill(String(item.math!.min));
        await entry.getByLabel("Số lớn nhất").fill(String(item.math!.max));
      } else if (template === "pair-or-no-pair") {
        await entry.getByLabel("Nội dung thẻ thứ hai").fill(item.secondary!);
        await entry.getByRole("combobox", { name: "Đáp án", exact: true }).selectOption(item.answers[0]);
      } else {
        await entry.getByLabel(kind === "sequence" ? "Các từ theo thứ tự đúng, mỗi dòng một từ hoặc cụm từ" :
          kind === "pair" ? "Mặt sau / giá trị ghép" : "Đáp án đúng, mỗi dòng một đáp án có trong phương án", { exact: true }).fill(item.answers.join("\n"));
        if (kind === "choice") await entry.getByLabel("Phương án, mỗi dòng một phương án").fill(item.options.join("\n"));
      }
      if (item.pin) {
        await entry.getByLabel("Vị trí ngang của ghim (%)").fill(String(item.pin.x));
        await entry.getByLabel("Vị trí dọc của ghim (%)").fill(String(item.pin.y));
      }
      if (item.media?.image || item.optionMedia) {
        await entry.getByText("Học liệu tiếng Anh và tệp", { exact: true }).click();
        if (item.media?.image) {
          await entry.getByLabel("Ảnh câu hỏi", { exact: true }).setInputFiles("public" + item.media.image);
          await expect(entry.getByRole("img", { name: "Ảnh câu hỏi", exact: true })).toBeVisible({ timeout: 25000 });
        }
        for (const option of item.optionMedia ?? []) {
          if (!option.image) continue;
          const details = entry.locator("details").filter({ has: page.locator("summary", { hasText: "Tệp cho phương án " + option.option }) }).last();
          await details.locator("summary").click();
          await details.getByLabel("Ảnh phương án", { exact: true }).setInputFiles("public" + option.image);
          await expect(details.getByRole("img", { name: "Ảnh phương án", exact: true })).toBeVisible({ timeout: 25000 });
        }
      }
    }
    await page.getByRole("button", { name: "Xuất bản" }).click();
    await expect(page.getByRole("button", { name: "Tạo link giao bài" })).toBeVisible({ timeout: 50000 });
    await page.getByRole("button", { name: "Bắt đầu" }).click();
    await expect(page.locator(".game-stage > .play-stack")).toBeVisible();
    await page.getByRole("button", { name: "Tạo link giao bài" }).click();
    const share = page.getByLabel("Link chia sẻ");
    await expect(share).toBeVisible({ timeout: 40000 });
    const student = await browser.newPage();
    try {
      await student.goto(await share.inputValue(), { waitUntil: "networkidle" });
      await student.getByLabel("Biệt danh").fill("Kiểm thử V1.4B");
      await student.getByRole("button", { name: "Bắt đầu" }).click();
      await expect(student.locator(".game-stage > .play-stack")).toBeVisible({ timeout: 45000 });
      await solvePuzzle(student, template, items, true);
      await expect(student.getByText("Bài làm đã được lưu.", { exact: true })).toBeVisible({ timeout: 45000 });
      await page.reload({ waitUntil: "networkidle" });
      const expected = template === "flip-tiles" ? "—" : (items.length - 1) + "/" + items.length;
      await expect(page.getByRole("row").filter({ hasText: "Kiểm thử V1.4B" })).toContainText(expected, { timeout: 30000 });
    } finally {
      await student.close();
      await page.getByRole("button", { name: "Đóng bài tập", exact: true }).click();
      await expect(page.getByText("Đã đóng", { exact: true })).toBeVisible({ timeout: 45000 });
    }
  });
}
