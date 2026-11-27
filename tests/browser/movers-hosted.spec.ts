import { expect as playwrightExpect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.use({ trace: "off" });
const expect = playwrightExpect.configure({ timeout: 30000 });

async function signIn(page: Page, second = false) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill((second ? process.env.E2E_OTHER_EMAIL : process.env.E2E_TEACHER_EMAIL)!);
  await page.getByLabel("Mật khẩu").fill((second ? process.env.E2E_OTHER_PASSWORD : process.env.E2E_TEACHER_PASSWORD)!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  try {
    await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible({ timeout: 45000 });
  } catch (error) {
    const password = page.getByLabel("Mật khẩu");
    if (await password.isVisible()) await password.clear();
    throw error;
  }
}

const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

for (const paper of ["listening", "reading", "speaking"]) {
  test(`QuizStudy Movers ${paper} saves assignment snapshots and results`, async ({ page, browser }, info) => {
    test.skip(info.project.name !== "desktop" || !process.env.E2E_TEACHER_EMAIL || !process.env.E2E_OTHER_EMAIL, "QuizStudy QA teachers required");
    test.setTimeout(150000);
    await signIn(page);
    await page.goto(`/samples/cambridge-movers/${paper}`, { waitUntil: "networkidle" });
    await expect(button(page, "Bắt đầu")).toBeEnabled();
    await button(page, "Lưu vào thư viện giáo viên").click();
    await expect(button(page, "Tạo link giao bài")).toBeVisible({ timeout: 20000 });
    await page.waitForLoadState("networkidle");
    const source = page.url();
    if (paper === "speaking") {
      await page.getByText("Hướng dẫn Speaking dành cho giáo viên").click();
      await expect(page.getByText(/Contrast the roof colour/)).toBeVisible();
    }
    await page.getByLabel(/Cho học sinh xem câu sai/).check();
    await button(page, "Tạo link giao bài").click();
    await expect(page.getByLabel("Link chia sẻ")).toBeVisible({ timeout: 20000 });
    const url = await page.getByLabel("Link chia sẻ").inputValue();
    const assignment = page.url();
    const student = await browser.newPage();
    const outsider = await browser.newPage();
    const nickname = "Movers Synthetic QA";
    try {
      if (paper !== "speaking") {
        await page.goto(new URL("?edit=1", source).toString(), { waitUntil: "networkidle" });
        if (paper === "listening") await page.getByLabel("Câu hỏi hoặc gợi ý").first().fill("Edited source prompt");
        else await page.getByLabel("Tên tiêu chí").first().fill("Edited source criterion");
        await button(page, "Xuất bản").click();
        await expect(page.getByText("Đã lưu thay đổi.", { exact: true })).toBeVisible();
      }
      await student.clock.install();
      await student.goto(url);
      const start = async () => {
        await student.getByLabel("Biệt danh").fill(nickname);
        await button(student, "Bắt đầu").click();
        await expect(student.getByRole("timer")).toBeVisible();
      };
      await start();
      if (paper === "listening") {
        await expect(student.getByRole("heading", { name: "Nora" })).toBeVisible();
        await button(student, "Person 2").click();
        await button(student, "Nghe đoạn hội thoại").click();
        await expect(student.getByText("Lượt nghe 1/2")).toBeVisible();
        await student.reload();
        await start();
        await expect(button(student, "Person 2")).toHaveAttribute("aria-pressed", "true");
        await expect(student.getByText("Lượt nghe 1/2")).toBeVisible();
        for (let i = 0; i < 24; i++) await button(student, "Tiếp theo").click();
        await button(student, "Nộp bài").click();
        await expect(student.getByText("1/25 điểm", { exact: true })).toBeVisible();
      } else if (paper === "reading") {
        await student.getByLabel("Your answer").fill("helmet");
        await button(student, "Tiếp theo").click();
        await student.getByLabel("Your answer").fill("wrong");
        for (let i = 1; i < 33; i++) await button(student, "Tiếp theo").click();
        await student.getByLabel("Your answer").fill("The person in the green shirt is standing on the left.");
        await button(student, "Tiếp theo").click();
        await student.getByLabel("Your answer").fill("There are three giraffes beside the stall.");
        await button(student, "Nộp bài").click();
        await expect(student.getByText("1/33 điểm tự động", { exact: true })).toBeVisible();
      } else {
        await expect(student.locator(".mover-scenes figure")).toHaveCount(2);
        await expect(student.getByText(/Contrast the roof colour/)).toHaveCount(0);
        await expect(student.getByRole("button", { name: /microphone|ghi âm/ })).toHaveCount(0);
        for (let i = 0; i < 3; i++) await button(student, "Tiếp theo").click();
        await button(student, "Nộp bài").click();
      }
      await expect(student.getByText("Bài làm đã được lưu.")).toBeVisible();
      await page.goto(assignment);
      const result = page.getByRole("link", { name: nickname });
      await expect(result).toBeVisible();
      const resultUrl = new URL((await result.getAttribute("href"))!, page.url()).toString();
      if (paper !== "listening") {
        await student.getByRole("link", { name: /Xem nhận xét/ }).click();
        await expect(student.getByText(/Đã nộp bài/)).toBeVisible();
        expect((await outsider.goto(student.url()))?.status()).toBe(404);
        await result.click();
        const rubric = page.getByRole("spinbutton");
        await expect(rubric).toHaveCount(paper === "reading" ? 2 : 5);
        if (paper === "reading") {
          await expect(page.getByText("The person in the green shirt is standing on the left.", { exact: true })).toBeVisible();
          await expect(page.getByLabel("Điểm Part 6, câu 5 / 1")).toBeVisible();
          await rubric.nth(0).fill("1");
          await rubric.nth(1).fill("0");
        } else {
          for (const input of await rubric.all()) await input.fill("3");
        }
        const feedback = "Synthetic Movers QA feedback.";
        await page.getByLabel("Nhận xét của giáo viên").fill(feedback);
        await button(page, "Công bố kết quả").click();
        await expect(page.getByText(/Đã công bố/)).toBeVisible();
        await student.reload();
        await expect(student.getByText(feedback)).toBeVisible();
        await expect(student.getByRole("heading", { name: paper === "reading" ? "2/35 điểm" : "15/20 điểm" })).toBeVisible();
      }
      await signIn(outsider, true);
      expect((await outsider.goto(resultUrl))?.status()).toBe(404);
      expect((await outsider.goto(new URL("/results/export?assignment=" + new URL(assignment).pathname.split("/").at(-1), assignment).toString()))?.status()).toBe(404);
      await page.goto(assignment);
      const exportReady = page.waitForEvent("download");
      await page.getByRole("link", { name: "Tải CSV" }).click();
      const csv = await readFile((await (await exportReady).path())!, "utf8");
      expect(csv).toContain(nickname);
      if (paper === "reading") expect(csv).toMatch(/Movers Synthetic QA[^\r\n]*2[^\r\n]*35[^\r\n]*published/);
      if (paper === "speaking") expect(csv).toMatch(/Movers Synthetic QA[^\r\n]*15[^\r\n]*20[^\r\n]*published/);
    } finally {
      await student.close();
      await outsider.close();
      if (!page.isClosed()) {
        await page.goto(assignment);
        await button(page, "Đóng bài tập").click();
      }
    }
  });
}
