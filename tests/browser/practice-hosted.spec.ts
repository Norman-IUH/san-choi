import { expect, test } from "@playwright/test";
import { practiceSample } from "../../lib/practice-samples";
import { isPhonics, listeningModes, type AudioPracticeMode } from "../../lib/games/practice";

test.use({ trace: "off" });
for (const mode of Object.keys(listeningModes) as AudioPracticeMode[]) {
  test(mode + " audio practice saves a server result on QuizStudy", async ({ page, browser }, info) => {
    const email = process.env.E2E_TEACHER_EMAIL;
    const password = process.env.E2E_TEACHER_PASSWORD;
    test.skip(!email || !password || (info.project.name !== "desktop" && !(info.project.name === "safari" && mode === "dictation")),
      "Requires QuizStudy QA teacher. WebKit reruns dictation audio.");
    test.setTimeout(120000);
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Mật khẩu").fill(password!);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible({ timeout: 45000 });
    await page.goto("/activities/new?practice=" + mode);
    await page.getByLabel("Tên hoạt động").fill("[TEST B1] " + mode);
    await page.getByLabel("Số lượt nghe tối đa (0 là không giới hạn)").first().fill("1");
    if (isPhonics(mode)) {
      await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
      await expect(page.getByRole("alert").filter({ hasText: "Kiểm tra clip" })).toBeVisible();
      await page.getByText("Học liệu tiếng Anh và tệp", { exact: true }).click();
      // This fixture verifies upload, author confirmation, playback and score persistence.
      await page.getByLabel("Âm thanh câu hỏi", { exact: true }).setInputFiles("public/audio/vocabulary/cat-us.wav");
      await expect(page.locator('audio[aria-label="Âm thanh câu hỏi"]')).toBeVisible();
      await page.getByRole("checkbox", { name: /đã nghe và kiểm tra/ }).check();
    }
    await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
    await page.getByRole("button", { name: "Tạo link giao bài", exact: true }).click();
    const share = page.getByLabel("Link chia sẻ");
    await expect(share).toBeVisible({ timeout: 35000 });
    const student = await browser.newPage({ viewport: { width: 390, height: 844 } });
    student.setDefaultTimeout(15000);
    try {
      await student.goto(await share.inputValue());
      const begin = student.getByRole("button", { name: "Bắt đầu", exact: true });
      await expect(begin).toBeEnabled();
      await student.getByLabel("Biệt danh").fill("Kiểm thử B1");
      await expect(student.getByLabel("Biệt danh")).toHaveValue("Kiểm thử B1");
      const startResponse = info.project.name === "desktop" ? student.waitForResponse(response =>
        response.request().method() === "POST" && new URL(response.url()).pathname.startsWith("/play/"), { timeout: 15000 }) : undefined;
      await begin.click();
      const sample = practiceSample(mode).item;
      if (startResponse) {
        const startBody = await (await startResponse).text();
        expect(startBody.includes('"answers"')).toBe(false);
        if (mode === "dictation") expect(startBody.includes(sample.answers[0])).toBe(false);
        if (sample.practice?.transcript) expect(startBody.includes(sample.practice.transcript)).toBe(false);
      }
      const audio = student.locator(".practice-round audio");
      await expect(audio).toHaveCount(1, { timeout: 15000 }).catch(async error => {
        const state = await student.locator("main").innerText({ timeout: 2500 }).catch(() => "Không đọc được màn hình");
        throw new Error("Màn hình học sinh: " + state, { cause: error });
      });
      const expectActualPlayback = () => expect.poll(() => audio.evaluate((clip: HTMLAudioElement) => clip.currentTime > 0), { timeout: 12000 }).toBe(true);
      if (mode === "rhymes") {
        let initialUrl = "";
        await student.route(url => url.pathname.includes("/object/sign/"), async route => {
          if (!initialUrl) initialUrl = route.request().url();
          if (initialUrl === route.request().url()) return route.fulfill({ status: 400, body: "Expired test URL" });
          return route.continue();
        });
        await student.getByRole("button", { name: "Nghe", exact: true }).click();
        await expect.poll(async () => Boolean(initialUrl && await audio.getAttribute("src") !== initialUrl), { timeout: 15000 }).toBe(true);
      }
      await student.getByRole("combobox", { name: "Tốc độ", exact: true }).selectOption("0.75");
      await student.getByRole("button", { name: "Nghe", exact: true }).click();
      await expectActualPlayback();
      await expect(student.getByText("Còn 0 lượt nghe", { exact: true })).toBeVisible();
      const stop = student.getByRole("button", { name: "Dừng audio", exact: true });
      if (await stop.isVisible()) await stop.click();
      await expect(student.getByRole("button", { name: "Nghe lại", exact: true })).toBeDisabled({ timeout: 18000 });
      expect(await student.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      if (mode === "dictation") await student.getByRole("textbox", { name: "Câu trả lời" }).fill("I have two red cups");
      else if (mode === "listen") {
        const picture = student.locator(".options .option").filter({ has: student.locator('img[src$="4b1c28ffa960.webp"]') });
        await picture.click();
        await expect(student.getByRole("button", { name: "apple", exact: true })).toHaveCount(0);
      } else if (mode === "listen-match") {
        await student.getByRole("button", { name: "kite", exact: true }).click();
        await student.getByRole("button", { name: "Clip 2", exact: true }).click();
        await expect(student.getByRole("button", { name: "kite", exact: true })).toBeDisabled();
        await student.getByRole("button", { name: "apple", exact: true }).click();
      } else await student.getByRole("button", { name: mode === "dialogue" ? "Soup" : sample.answers[0], exact: true }).click();
      await student.getByRole("button", { name: "Hoàn thành", exact: true }).click();
      const score = mode === "dialogue" ? "0/1" : mode === "listen-match" ? "2/2" : "1/1";
      await expect(student.getByText(score + " điểm", { exact: true })).toBeVisible({ timeout: 30000 });
      await page.reload();
      await expect(page.getByRole("row").filter({ hasText: "Kiểm thử B1" })).toContainText(score);
    } finally {
      await student.close();
      await page.getByRole("button", { name: "Đóng bài tập", exact: true }).click();
    }
  });
}
