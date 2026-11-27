import { expect as playwrightExpect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.use({ trace: "off" });
const expect = playwrightExpect.configure({ timeout: 30000 });
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const learner = "Flyers Synthetic QA";
const story = "Two friends tried to fly a kite by the harbour. The kite got caught in a tree. They worked together to get it back and flew it again.";

async function signIn(page: Page, second = false) {
  await page.goto("/login", { waitUntil: "networkidle" });
  const password = page.getByLabel("Mật khẩu");
  await page.getByLabel("Email").fill((second ? process.env.E2E_OTHER_EMAIL : process.env.E2E_TEACHER_EMAIL)!);
  await password.fill((second ? process.env.E2E_OTHER_PASSWORD : process.env.E2E_TEACHER_PASSWORD)!);
  try {
    await button(page, "Đăng nhập").click();
    await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible({ timeout: 45000 });
  } catch (error) {
    if (await password.isVisible()) await password.clear();
    throw error;
  }
}

for (const paper of ["listening", "reading", "speaking"]) {
  test(`QuizStudy Flyers ${paper} preserves, scores and exports the matched attempt`, async ({ page, browser }, info) => {
    test.skip(info.project.name !== "desktop" || !process.env.E2E_TEACHER_EMAIL || !process.env.E2E_OTHER_EMAIL, "QuizStudy QA teachers required");
    test.setTimeout(200000);
    await signIn(page);
    await page.goto(`/samples/cambridge-flyers/${paper}`, { waitUntil: "networkidle" });
    await expect(button(page, "Bắt đầu")).toBeEnabled();
    await button(page, "Lưu vào thư viện giáo viên").click();
    await expect(button(page, "Tạo link giao bài")).toBeVisible();
    await page.waitForLoadState("networkidle");
    if (paper === "listening") {
      await button(page, "Sao chép").click();
      await expect(page.locator(".section-head h1")).toContainText("(bản sao)");
      await page.waitForLoadState("networkidle");
    }
    const source = page.url();
    if (paper === "speaking") {
      await page.getByText("Hướng dẫn Speaking dành cho giáo viên").click();
      await expect(page.getByText(/The boat leaves at 2:10 p.m./)).toBeVisible();
    }
    await page.getByLabel(/Cho học sinh xem câu sai/).check();
    await button(page, "Tạo link giao bài").click();
    const share = page.getByLabel("Link chia sẻ");
    await expect(share).toBeVisible();
    const assignment = page.url();
    const link = await share.inputValue();
    const student = await browser.newPage();
    const outsider = await browser.newPage();
    try {
      if (paper !== "speaking") {
        await page.goto(new URL("?edit=1", source).toString(), { waitUntil: "networkidle" });
        if (paper === "listening") await page.getByLabel("Câu hỏi hoặc gợi ý").first().fill("Edited Flyers source prompt");
        else await page.getByLabel("Tên tiêu chí").first().fill("Edited source story rubric");
        await button(page, "Xuất bản").click();
        await expect(page.getByText("Đã lưu thay đổi.", { exact: true })).toBeVisible();
      }
      await student.clock.install();
      await student.goto(link);
      await student.getByLabel("Biệt danh").fill(learner);
      await button(student, "Bắt đầu").click();
      await expect(student.getByRole("timer")).toBeVisible();
      if (paper === "listening") {
        await expect(student.getByRole("heading", { name: "Owen", exact: true })).toBeVisible();
        await button(student, "Person 3").click();
        await button(student, "Nghe đoạn hội thoại").click();
        await expect(student.getByText("Lượt nghe 1/2")).toBeVisible();
        await student.route(link, route => route.request().method() === "POST" ? route.abort() : route.continue());
        await student.clock.fastForward(25 * 60 * 1000 + 1000);
        await expect(button(student, "Nộp lại")).toBeEnabled();
        await expect(student.getByText("Đã hết thời gian")).toBeVisible();
        await student.unroute(link);
        await student.reload();
        await expect(student.getByLabel("Biệt danh")).toHaveValue(learner);
        await button(student, "Bắt đầu").click();
        await expect(student.getByText("1/25 điểm", { exact: true })).toBeVisible();
      } else if (paper === "reading") {
        await student.getByLabel("Your answer").fill("architect");
        for (let i = 0; i < 43; i++) await button(student, "Tiếp theo").click();
        await student.getByLabel("Your answer").fill(story);
        let upstreamStatus: number | undefined;
        await student.route(link, async route => {
          if (route.request().method() !== "POST") return route.continue();
          upstreamStatus = (await route.fetch()).status();
          await route.abort();
        });
        await button(student, "Nộp bài").click();
        await expect(button(student, "Nộp lại")).toBeEnabled();
        expect(upstreamStatus).toBe(200);
        await student.unroute(link);
        await student.reload();
        await button(student, "Bắt đầu").click();
        await expect(student.getByText("1/43 điểm tự động", { exact: true })).toBeVisible();
      } else {
        await expect(student.locator(".mover-scenes figure")).toHaveCount(2);
        await button(student, "Tiếp theo").click();
        await button(student, "Ask the examiner").click();
        await expect(student.getByText("Harbour boat trip", { exact: true })).toBeVisible();
        await expect(student.getByText(/2:10 p.m./)).toHaveCount(0);
        await expect(student.getByRole("button", { name: /microphone|ghi âm/ })).toHaveCount(0);
        await button(student, "Tiếp theo").click();
        await expect(student.locator(".mover-scenes figure")).toHaveCount(4);
        await button(student, "Tiếp theo").click();
        await button(student, "Nộp bài").click();
      }
      await expect(student.getByText("Bài làm đã được lưu.")).toBeVisible();
      await page.goto(assignment);
      const result = page.getByRole("link", { name: learner, exact: true });
      await expect(result).toHaveCount(1);
      const resultUrl = new URL((await result.getAttribute("href"))!, assignment).toString();
      if (paper !== "listening") {
        await student.getByRole("link", { name: /Xem nhận xét/ }).click();
        await expect(student.getByText(/Đã nộp bài/)).toBeVisible();
        expect((await outsider.goto(student.url()))?.status()).toBe(404);
        await result.click();
        const rubric = page.getByRole("spinbutton");
        await expect(rubric).toHaveCount(paper === "reading" ? 3 : 5);
        if (paper === "reading") {
          await expect(page.getByText(story, { exact: true })).toBeVisible();
          await expect(page.getByLabel("Điểm Ba khung tranh / 2")).toBeVisible();
          await expect(page.getByRole("img", { name: /Tranh \d của đề viết/ })).toHaveCount(3);
        }
        for (const mark of await rubric.all()) await mark.fill(paper === "reading" ? "1" : "3");
        const feedback = "Synthetic Flyers assessment.";
        await page.getByLabel("Nhận xét của giáo viên").fill(feedback);
        await button(page, "Công bố kết quả").click();
        await expect(page.getByText(/Đã công bố/)).toBeVisible();
        await student.reload();
        await expect(student.getByText(feedback)).toBeVisible();
        await expect(student.getByRole("heading", { name: paper === "reading" ? "4/48 điểm" : "15/20 điểm" })).toBeVisible();
      }
      await signIn(outsider, true);
      expect((await outsider.goto(resultUrl))?.status()).toBe(404);
      const exportPath = "/results/export?assignment=" + new URL(assignment).pathname.split("/").at(-1);
      expect((await outsider.goto(new URL(exportPath, assignment).toString()))?.status()).toBe(404);
      await page.goto(assignment);
      const file = page.waitForEvent("download");
      await page.getByRole("link", { name: "Tải CSV" }).click();
      const csv = await readFile((await (await file).path())!, "utf8");
      if (paper === "listening") expect(csv).toContain(`"${learner}","1","25"`);
      if (paper === "reading") expect(csv).toMatch(/"Flyers Synthetic QA","4","48"[^\r\n]*,"1","3","published"/);
      if (paper === "speaking") expect(csv).toMatch(/"Flyers Synthetic QA","15","20"[^\r\n]*,"","15","published"/);
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
