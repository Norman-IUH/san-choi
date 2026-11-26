import { expect, test } from "@playwright/test";
import { demoContent } from "../../lib/demo";
import { wordTemplates, type WordTemplate } from "../../lib/games/word-templates";
import { solveWordGame } from "./solve-word-game";

test.use({ trace: "off" });

for (const template of Object.keys(wordTemplates) as WordTemplate[]) {
  test(template + " publishes, previews, assigns and persists its score", async ({ page, browser }, info) => {
    const email = process.env.E2E_TEACHER_EMAIL;
    const password = process.env.E2E_TEACHER_PASSWORD;
    test.skip(info.project.name !== "desktop" || !email || !password, "Requires a test teacher on QuizStudy");
    test.setTimeout(300000);
    const meta = wordTemplates[template];
    const items = demoContent(template);
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Mật khẩu").fill(password!);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible({ timeout: 45000 });
    await page.goto("/activities/new?template=" + template);
    await page.getByLabel("Tên hoạt động").fill("[TEST V1.4A] " + meta.title);
    for (const [i, item] of items.entries()) {
      if (i > 0) await page.getByRole("button", { name: "Thêm mục" }).click();
      const entry = page.getByRole("group", { name: "Mục " + (i + 1) });
      await entry.getByLabel(meta.kind === "pair" ? "Mặt trước / nội dung" : "Câu hỏi hoặc gợi ý").fill(item.prompt);
      const answer = entry.getByLabel(meta.kind === "pair" ? "Mặt sau / giá trị ghép" :
        meta.kind === "sequence" ? "Các từ theo thứ tự đúng, mỗi dòng một từ hoặc cụm từ" : "Đáp án", { exact: true });
      if (template === "true-false") await entry.getByRole("combobox", { name: "Đáp án", exact: true }).selectOption(item.answers[0]);
      else await answer.fill(item.answers.join("\n"));
    }
    await page.getByRole("button", { name: "Xuất bản" }).click();
    await expect(page.getByRole("button", { name: "Tạo link giao bài" })).toBeVisible({ timeout: 60000 });
    await page.getByRole("button", { name: "Bắt đầu" }).click();
    await expect(page.locator(".game-stage > .play-stack")).toBeVisible();
    await page.getByRole("button", { name: "Tạo link giao bài" }).click();
    const share = page.getByLabel("Link chia sẻ");
    await expect(share).toBeVisible({ timeout: 45000 });
    const student = await browser.newPage();
    try {
      await student.goto(await share.inputValue(), { waitUntil: "networkidle" });
      await student.getByLabel("Biệt danh").fill("Kiểm thử V1.4A");
      await student.getByRole("button", { name: "Bắt đầu" }).click();
      await expect(student.locator(".game-stage > .play-stack")).toBeVisible({ timeout: 45000 });
      await solveWordGame(student, template, items);
      await expect(student.getByText(items.length + "/" + items.length + " điểm", { exact: true })).toBeVisible({ timeout: 45000 });
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.getByRole("row").filter({ hasText: "Kiểm thử V1.4A" })).toContainText(items.length + "/" + items.length, { timeout: 30000 });
    } finally {
      await student.close();
      await page.getByRole("button", { name: "Đóng bài tập", exact: true }).click();
      await expect(page.getByText("Đã đóng", { exact: true })).toBeVisible({ timeout: 45000 });
    }
  });
}
