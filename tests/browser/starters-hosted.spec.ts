import { expect as playwrightExpect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.use({ trace: "off" });
const expect = playwrightExpect.configure({ timeout: 25000 });

for (const paper of ["listening", "reading", "speaking"]) {
  test(`QuizStudy saves and scores the Starters ${paper} mock`, async ({ page, browser }, info) => {
    test.skip(info.project.name !== "desktop" || !process.env.E2E_TEACHER_EMAIL, "QuizStudy QA teacher required");
    test.setTimeout(90000);
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.getByLabel("Email").fill(process.env.E2E_TEACHER_EMAIL!);
    await page.getByLabel("Mật khẩu").fill(process.env.E2E_TEACHER_PASSWORD!);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible();
    await page.goto(`/samples/cambridge-starters/${paper}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Bắt đầu", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Lưu vào thư viện giáo viên" }).click();
    await expect(page.getByText("Đã lưu thay đổi.", { exact: true })).toBeVisible({ timeout: 20000 });
    await page.waitForLoadState("networkidle");
    if (paper === "speaking") {
      await page.getByText("Hướng dẫn Speaking dành cho giáo viên").click();
      await expect(page.getByText(/Put the apple beside the boy/)).toBeVisible();
    }
    await page.getByLabel(/Cho học sinh xem câu sai/).check();
    await page.getByRole("button", { name: "Tạo link giao bài" }).click();
    const field = page.getByLabel("Link chia sẻ");
    await expect(field).toBeVisible({ timeout: 20000 });
    const url = await field.inputValue();
    const assignmentUrl = page.url();
    const student = await browser.newPage();
    const nickname = "Starters Synthetic QA";
    try {
      await student.goto(url);
      await student.getByLabel("Biệt danh").fill(nickname);
      await student.getByRole("button", { name: "Bắt đầu", exact: true }).click();
      await expect(student.getByRole("timer")).toBeVisible();
      await expect(student.getByText(/Put the apple beside the boy/)).toHaveCount(0);
      if (paper === "listening") {
        await student.getByRole("button", { name: "Person 4", exact: true }).click();
        const audio = student.locator("audio");
        const src = await audio.getAttribute("src");
        expect((await student.request.get(new URL(src!, url).href)).ok()).toBe(true);
      }
      if (paper === "reading") await student.getByRole("button", { name: "✓ Tick", exact: true }).click();
      await student.clock.install();
      if (paper === "speaking") {
        await expect(student.getByRole("button", { name: /microphone|ghi âm/ })).toHaveCount(0);
        for (let i = 0; i < 3; i++) await student.getByRole("button", { name: "Tiếp theo", exact: true }).click();
        await student.getByRole("button", { name: "Nộp bài", exact: true }).click();
      } else {
        await student.clock.fastForward(20 * 60 * 1000 + 1000);
        await expect(student.getByText(paper === "listening" ? "1/20 điểm" : "1/25 điểm", { exact: true })).toBeVisible();
      }
      await expect(student.getByText("Bài làm đã được lưu.")).toBeVisible();
      await page.reload();
      await expect(page.getByRole("link", { name: nickname })).toBeVisible();
      if (paper === "speaking") {
        await expect(page.getByText("Chờ chấm", { exact: true })).toBeVisible();
        const review = student.getByRole("link", { name: /Xem nhận xét/ });
        await review.click();
        await page.getByRole("link", { name: nickname }).click();
        const rubric = page.getByRole("spinbutton");
        await expect(rubric).toHaveCount(5);
        for (const input of await rubric.all()) await input.fill("3");
        await page.getByLabel("Nhận xét của giáo viên").fill("Synthetic QA review for classroom Speaking.");
        await page.getByRole("button", { name: "Công bố kết quả" }).click();
        await expect(page.getByText(/Đã công bố/)).toBeVisible();
        await student.reload();
        await expect(student.getByText("Synthetic QA review for classroom Speaking.")).toBeVisible();
        await page.goto(assignmentUrl);
      }
      const exported = page.waitForEvent("download");
      await page.getByRole("link", { name: "Tải CSV" }).click();
      expect(await readFile((await (await exported).path())!, "utf8")).toContain(nickname);
    } finally {
      await student.close();
      await page.goto(assignmentUrl);
      await page.getByRole("button", { name: "Đóng bài tập" }).click();
    }
  });
}
