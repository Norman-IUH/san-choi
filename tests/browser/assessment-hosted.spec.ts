import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.use({ trace: "off" });

async function teacher(page: Page, other = false) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill((other ? process.env.E2E_OTHER_EMAIL : process.env.E2E_TEACHER_EMAIL)!);
  await page.getByLabel("Mật khẩu").fill((other ? process.env.E2E_OTHER_PASSWORD : process.env.E2E_TEACHER_PASSWORD)!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible({ timeout: 45000 });
}

test("Writing on QuizStudy preserves the rubric, responses and session access", async ({ page, browser }, info) => {
  test.skip(!["desktop", "safari"].includes(info.project.name) || !process.env.E2E_TEACHER_EMAIL || !process.env.E2E_OTHER_EMAIL, "QuizStudy QA teachers required");
  test.setTimeout(150000);
  await teacher(page);
  await page.goto("/activities/new?practice=short-paragraph", { waitUntil: "networkidle" });
  const name = `[B3 QA] Writing ${info.project.name} ${Date.now()}`;
  await page.getByLabel("Tên hoạt động").fill(name);
  await page.getByLabel("Tên tiêu chí").first().fill("Clarity QA");
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect(page.getByText("Đã lưu thay đổi.")).toBeVisible();
  const sourceUrl = page.url();
  await page.getByRole("button", { name: "Tạo link giao bài", exact: true }).click();
  const share = page.getByLabel("Link chia sẻ");
  await expect(share).toBeVisible();
  const url = await share.inputValue();
  const assignmentUrl = page.url();
  const student = await browser.newPage();
  const outsider = await browser.newPage();
  try {
    await page.goto(new URL("?edit=1", sourceUrl).toString(), { waitUntil: "networkidle" });
    await page.getByLabel("Tên tiêu chí").first().fill("New source rubric QA");
    await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
    await expect(page.getByText("Đã lưu thay đổi.")).toBeVisible();
    await student.goto(url);
    const start = async () => {
      const begin = student.getByRole("button", { name: "Bắt đầu", exact: true });
      await expect(begin).toBeEnabled();
      await student.getByLabel("Biệt danh").fill("Writing QA");
      await begin.click();
    };
    await start();
    const text = "The group walked to the village. They decided to have lunch there while the driver called for help.";
    await student.getByRole("textbox", { name: "Câu trả lời" }).fill(text);
    await expect.poll(() => student.evaluate(() => Object.values(sessionStorage).some(value => value.includes("the village")))).toBe(true);
    await student.reload();
    await start();
    await expect(student.getByRole("textbox", { name: "Câu trả lời" })).toHaveValue(text);
    await student.getByRole("button", { name: "Hoàn thành", exact: true }).click();
    await student.getByRole("link", { name: /Xem nhận xét/ }).click();
    await expect(student.getByText(/Đã nộp bài/)).toBeVisible();
    expect((await outsider.goto(student.url()))?.status()).toBe(404);
    await page.goto(`/results?state=pending&skill=Writing&assignment=${new URL(assignmentUrl).pathname.split("/").at(-1)}`);
    await page.getByRole("link", { name: `Writing QA · ${name}` }).click();
    await expect(page).toHaveURL(/\/results\/[0-9a-f-]{36}$/);
    const resultUrl = page.url();
    await expect(page.getByText(text, { exact: true })).toBeVisible();
    const score = page.getByRole("spinbutton", { name: "Điểm Clarity QA / 4" });
    await score.fill("3");
    await expect(page.getByRole("button", { name: "Công bố kết quả" })).toBeDisabled();
    await page.getByLabel("Nhận xét của giáo viên").fill("QA feedback stays private until published.");
    await page.getByRole("button", { name: "Lưu đánh giá" }).click();
    await expect(page.locator(".assessment-panel")).toHaveAttribute("data-review-revision", "1", { timeout: 20000 });
    await student.reload();
    await expect(student.getByText(/QA feedback/)).toHaveCount(0);
    const inputs = await page.getByRole("spinbutton").all();
    for (const input of inputs) await input.fill("4");
    await page.getByRole("button", { name: "Công bố kết quả" }).click();
    await expect(page.locator(".assessment-panel")).toHaveAttribute("data-review-revision", "2");
    await expect(page.getByText(/Đã công bố/)).toBeVisible();
    await student.reload();
    await expect(student.getByText("20/20 điểm", { exact: true })).toBeVisible();
    await score.fill("2");
    await page.getByRole("button", { name: "Công bố kết quả" }).click();
    await expect(page.locator(".assessment-panel")).toHaveAttribute("data-review-revision", "3");
    await expect(page.getByText("18/20 điểm", { exact: true })).toBeVisible();
    await student.reload();
    await expect(student.getByText("18/20 điểm", { exact: true })).toBeVisible();
    await teacher(outsider, true);
    await outsider.goto(resultUrl);
    await expect(outsider.getByRole("heading", { name: "Trang không khả dụng" })).toBeVisible();
    await expect(outsider.getByText(text, { exact: true })).toHaveCount(0);
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  } finally {
    await student.close(); await outsider.close();
    await page.goto(assignmentUrl);
    await page.getByRole("button", { name: "Đóng bài tập", exact: true }).click();
  }
});

test("objective Writing scores the accepted variant, a wrong answer and a blank", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "desktop" || !process.env.E2E_TEACHER_EMAIL, "QuizStudy desktop teacher required");
  test.setTimeout(110000);
  await teacher(page);
  await page.goto("/activities/new?practice=short-answers", { waitUntil: "networkidle" });
  await page.getByLabel("Tên hoạt động").fill(`[B3 QA] Objective ${Date.now()}`);
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await page.getByRole("button", { name: "Tạo link giao bài", exact: true }).click();
  const share = page.getByLabel("Link chia sẻ");
  await expect(share).toBeVisible();
  const url = await share.inputValue();
  try {
    for (const [answer, score] of [["It is red.", "1/1"], ["green", "0/1"], ["", "0/1"]]) {
      const student = await browser.newPage();
      try {
        await student.goto(url);
        const start = student.getByRole("button", { name: "Bắt đầu", exact: true });
        await expect(start).toBeEnabled();
        await student.getByLabel("Biệt danh").fill("Objective QA " + (answer || "blank"));
        await start.click();
        if (answer) await student.getByRole("textbox", { name: "Câu trả lời" }).fill(answer);
        await student.getByRole("button", { name: "Hoàn thành", exact: true }).click();
        await expect(student.getByText(`${score} điểm`, { exact: true })).toBeVisible({ timeout: 15000 });
      } finally { await student.close(); }
    }
  } finally { await page.getByRole("button", { name: "Đóng bài tập", exact: true }).click(); }
});

test("Speaking keeps fixture audio private and supports classroom assessment", async ({ page, browser }, info) => {
  test.skip(!["desktop", "safari"].includes(info.project.name) || process.env.E2E_VOICE_FIXTURE !== "1" ||
    !process.env.E2E_TEACHER_EMAIL || !process.env.E2E_OTHER_EMAIL, "Loopback app and synthetic fixture required");
  test.setTimeout(150000);
  await teacher(page);
  await page.goto("/activities/new?practice=describe-picture", { waitUntil: "networkidle" });
  await page.getByLabel("Tên hoạt động").fill(`[B3 QA] Speaking ${info.project.name} ${Date.now()}`);
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await page.getByRole("button", { name: "Tạo link giao bài", exact: true }).click();
  const share = page.getByLabel("Link chia sẻ");
  await expect(share).toBeVisible();
  const url = await share.inputValue();
  const assignmentUrl = page.url();
  const student = await browser.newPage();
  const outsider = await browser.newPage();
  const origin = new URL(url).origin;
  const voice = `${url}/voice/0`;
  try {
    await student.addInitScript(() => {
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", { value: () => Promise.reject(new DOMException("QA denial", "NotAllowedError")) });
    });
    await student.goto(url);
    const start = student.getByRole("button", { name: "Bắt đầu", exact: true });
    await expect(start).toBeEnabled();
    await student.getByLabel("Biệt danh").fill("Speaking fixture QA");
    await start.click();
    await student.getByRole("button", { name: "Bật microphone và ghi âm" }).click();
    const supportsRecording = await student.evaluate(() => typeof MediaRecorder === "function" && ["audio/webm;codecs=opus", "audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/ogg;codecs=opus"]
      .some(mime => MediaRecorder.isTypeSupported(mime)));
    await expect(student.getByRole("alert").filter({ hasText: supportsRecording ? "Quyền microphone" : "chưa hỗ trợ ghi âm" })).toBeVisible();
    const bytes = await readFile("public/audio/practice/aa1000000004.wav");
    const upload = (data: Buffer, mime = "audio/wav") => student.request.post(voice, { data, headers: { Origin: origin, "Content-Type": mime } });
    expect((await upload(bytes, "image/png")).status()).toBe(415);
    expect((await upload(Buffer.from("not sound"))).status()).toBe(415);
    expect((await upload(Buffer.alloc(2 * 1024 * 1024 + 1))).status()).toBe(413);
    expect((await outsider.request.post(voice, { data: bytes, headers: { Origin: origin, "Content-Type": "audio/wav" } })).status()).toBe(404);
    expect((await upload(bytes)).status()).toBe(204);
    expect((await upload(bytes)).status()).toBe(204);
    expect((await student.request.get(voice)).ok()).toBe(true);
    expect((await student.request.delete(voice, { headers: { Origin: origin } })).status()).toBe(204);
    expect((await (await student.request.get(voice)).json()).saved).toBe(false);
    expect((await upload(bytes)).status()).toBe(204);
    await student.getByRole("button", { name: "Hoàn thành", exact: true }).click();
    await expect(student.getByRole("link", { name: /Xem nhận xét/ })).toBeVisible();
    expect((await student.request.get(voice)).status()).toBe(404);
    await page.reload();
    await page.getByRole("link", { name: "Speaking fixture QA", exact: true }).click();
    await expect(page).toHaveURL(/\/results\/[0-9a-f-]{36}$/);
    await expect(page.locator('audio[aria-label="Bản ghi mục 1"]')).toBeVisible();
    const path = page.url() + "/voice/0";
    const media = await page.request.get(path, { maxRedirects: 0, headers: { Range: "bytes=0-31" } });
    expect([200, 206]).toContain(media.status());
    expect(media.headers()["content-type"]).toContain("audio/");
    expect(media.headers()["cache-control"]).toContain("no-store");
    expect(media.headers().location).toBeUndefined();
    await teacher(outsider, true);
    expect((await outsider.request.get(path, { maxRedirects: 0 })).status()).toBe(404);
    page.once("dialog", dialog => void dialog.accept());
    await page.getByRole("button", { name: "Xóa bản ghi mục 1", exact: true }).click();
    await expect(page.getByText("Đã xóa bản ghi.")).toBeVisible({ timeout: 15000 });
    expect((await page.request.get(path)).status()).toBe(404);
    await page.goto(assignmentUrl);
    await page.getByText("Chấm trực tiếp trên lớp", { exact: true }).click();
    await page.getByLabel("Biệt danh để chấm trực tiếp").fill("Classroom QA");
    await page.getByRole("button", { name: "Mở rubric chấm trực tiếp" }).click();
    await expect(page.getByRole("heading", { name: "Bài làm của Classroom QA" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Đánh giá theo rubric" })).toBeVisible();
  } finally {
    await student.close(); await outsider.close();
    await page.goto(assignmentUrl);
    await page.getByRole("button", { name: "Đóng bài tập", exact: true }).click();
  }
});

test("vocabulary review stays private and editing an approved word invalidates it", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "desktop" || !process.env.E2E_TEACHER_EMAIL || !process.env.E2E_OTHER_EMAIL, "QuizStudy QA teachers required");
  test.setTimeout(120000);
  await teacher(page);
  const word = `QA vocabulary ${Date.now()}`;
  await page.goto("/library/words/new", { waitUntil: "networkidle" });
  await page.getByLabel("Từ hoặc cụm từ").fill(word);
  await page.getByLabel("Nghĩa tiếng Việt").fill("từ dùng để kiểm thử");
  await page.getByLabel("Chủ đề").fill("Fixture");
  await page.getByLabel("Từ loại").fill("noun");
  await page.getByLabel("IPA", { exact: true }).fill("/bʊk/");
  await page.getByLabel("Câu ví dụ").fill("Here is a book.");
  await page.getByRole("button", { name: "Lưu từ vựng" }).click();
  await expect(page.getByText("Đã lưu từ vựng.")).toBeVisible();
  const filter = `/library/review?level=Kids&q=${encodeURIComponent(word)}`;
  await page.goto(filter, { waitUntil: "networkidle" });
  const entry = page.getByRole("article").filter({ hasText: word });
  await expect(entry.getByText("/bʊk/", { exact: true })).toBeVisible();
  await entry.getByLabel("Nhận xét duyệt").fill("QA note for correction.");
  await entry.getByRole("button", { name: "Cần chỉnh sửa", exact: true }).click();
  await expect(entry.locator("strong")).toHaveText("Cần chỉnh sửa");
  await entry.getByRole("button", { name: "Đã duyệt", exact: true }).click();
  await expect(entry.locator("strong")).toHaveText("Đã duyệt");
  await page.goto(`${filter}&state=approved`);
  await expect(entry).toBeVisible();
  await entry.getByRole("link", { name: "Chỉnh nội dung" }).click();
  await page.getByLabel("Câu ví dụ").fill("The book is on the desk.");
  await page.getByRole("button", { name: "Lưu từ vựng" }).click();
  await page.goto(`${filter}&state=pending`);
  await expect(entry.locator("strong")).toHaveText("Chưa duyệt");
  await expect(entry.getByLabel("Nhận xét duyệt")).toHaveValue("QA note for correction.");
  const other = await browser.newPage();
  try {
    await teacher(other, true);
    await other.goto(filter);
    await expect(other.getByRole("heading", { name: word, exact: true })).toHaveCount(0);
  } finally { await other.close(); }
});

test("a Speaking and Writing sample presents while draft and assigns only when ready", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop" || !process.env.E2E_TEACHER_EMAIL, "QuizStudy desktop teacher required");
  test.setTimeout(120000);
  await teacher(page);
  await page.goto("/library/new?sample=routine-skills", { waitUntil: "networkidle" });
  const title = `[B3 QA] Speaking lesson ${Date.now()}`;
  await page.getByLabel("Tên giáo án").fill(title);
  await page.getByRole("button", { name: "Lưu nháp giáo án" }).click();
  await expect(page.getByText("Đã lưu giáo án.")).toBeVisible();
  const plan = page.url();
  const step = page.getByRole("link").filter({ hasText: "Two classroom pictures" });
  await step.click();
  await expect(step).toHaveAttribute("aria-current", "step");
  await expect(page.getByText(/trạng thái sẵn sàng để giao/)).toBeVisible();
  await expect(page.getByText(/Giao hoạt động này/)).toHaveCount(0);
  await page.getByRole("link", { name: "Trình chiếu", exact: true }).click();
  await expect(page.getByRole("link", { name: "Thoát trình chiếu" })).toBeVisible();
  const begin = page.locator("#lesson-stage").getByRole("button", { name: "Bắt đầu", exact: true });
  await expect(begin).toBeEnabled();
  await begin.click();
  await expect(page.getByRole("img", { name: "Hình ngữ liệu 2" })).toBeVisible();
  await page.getByRole("button", { name: "Bắt đầu chuẩn bị" }).click();
  await expect(page.getByRole("timer")).toContainText("Chuẩn bị");
  await page.goto(plan);
  await page.getByRole("link", { name: "Sửa giáo án", exact: true }).click();
  await page.getByRole("button", { name: "Lưu giáo án", exact: true }).click();
  await expect(page.getByText("Đã lưu giáo án.")).toBeVisible();
  await step.click();
  await expect(step).toHaveAttribute("aria-current", "step");
  await page.getByText("Giao hoạt động này · Two classroom pictures", { exact: true }).click();
  await page.getByRole("button", { name: "Tạo link giao bài", exact: true }).click();
  await expect(page).toHaveURL(/\/assignments\/[0-9a-f-]{36}$/, { timeout: 25000 });
  await expect(page.getByLabel("Link chia sẻ")).toBeVisible();
  await page.getByRole("button", { name: "Đóng bài tập", exact: true }).click();
});
