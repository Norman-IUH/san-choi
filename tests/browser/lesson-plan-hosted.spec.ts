import { expect, test, type Page } from "@playwright/test";

test.use({ trace: "off" });
async function login(page: Page, other = false) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill((other ? process.env.E2E_OTHER_EMAIL : process.env.E2E_TEACHER_EMAIL)!);
  await page.getByLabel("Mật khẩu").fill((other ? process.env.E2E_OTHER_PASSWORD : process.env.E2E_TEACHER_PASSWORD)!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible({ timeout: 45000 });
}

test("lesson plan saves, reorders, presents and grades a Reading snapshot", async ({ page, browser }, info) => {
  test.skip(!process.env.E2E_TEACHER_EMAIL || !process.env.E2E_OTHER_EMAIL || !["desktop", "safari"].includes(info.project.name),
    "Needs two QuizStudy teachers and desktop Chromium or WebKit.");
  test.setTimeout(160000);
  await login(page);
  const name = `[TEST B2 ${info.project.name}] Shared passage ${Date.now()}`;
  await page.goto("/activities/new?practice=passage-reading", { waitUntil: "networkidle" });
  await page.getByLabel("Tên hoạt động").fill(name);
  await page.getByText("Học liệu tiếng Anh và tệp", { exact: true }).first().click();
  await page.getByLabel("Giải thích đáp án").first().fill("PRIVATE READING EXPLANATION");
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await expect(page.getByText("Đã lưu thay đổi.")).toBeVisible();
  const activityUrl = page.url();
  await page.goto("/library/new?sample=routine", { waitUntil: "networkidle" });
  const lessonTitle = `[TEST B2 ${info.project.name}] Lesson ${Date.now()}`;
  await page.getByLabel("Tên giáo án").fill(lessonTitle);
  await page.getByLabel("Ghi chú riêng của giáo viên").fill("PRIVATE TEACHER PLAN NOTE");
  await page.getByRole("button", { name: "Bỏ hoạt động 3", exact: true }).click();
  await page.getByLabel("Hoạt động từ thư viện").selectOption({ label: name });
  await page.getByRole("button", { name: "Thêm hoạt động", exact: true }).click();
  await page.getByRole("button", { name: "Đưa hoạt động 5 lên", exact: true }).press("Enter");
  await expect(page.locator(".lesson-timeline > li").nth(3)).toContainText(name);
  await page.getByRole("button", { name: "Lưu nháp giáo án", exact: true }).click();
  await expect(page.getByText("Đã lưu giáo án.")).toBeVisible();
  const lessonUrl = page.url();
  const outline = page.getByRole("list", { name: "Tiến trình giáo án" });
  await page.reload();
  await expect(outline.getByRole("listitem").nth(3)).toContainText(name);
  await page.getByRole("link", { name: "Sửa giáo án", exact: true }).click();
  await expect(page.getByLabel("Ghi chú riêng của giáo viên")).toHaveValue("PRIVATE TEACHER PLAN NOTE");
  await page.getByRole("button", { name: "Lưu giáo án", exact: true }).click();
  await page.getByRole("button", { name: "Nhân bản giáo án", exact: true }).click();
  await expect(page.getByRole("heading", { name: lessonTitle + " (bản sao)", exact: true }).first()).toBeVisible();
  await page.goto(lessonUrl);
  await page.getByRole("link", { name: "Trình chiếu", exact: true }).click();
  const stage = page.locator("#lesson-stage");
  await expect(page).toHaveURL(/mode=present/);
  await expect(stage.getByRole("link", { name: "Thoát trình chiếu" })).toBeVisible();
  await expect(stage.getByText("1 / 5", { exact: false })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("PRIVATE TEACHER PLAN NOTE");
  await stage.getByRole("link", { name: /Hoạt động tiếp theo/ }).click();
  await expect(stage.getByText("2 / 5", { exact: false })).toBeVisible();
  await expect(stage.getByRole("button", { name: "Toàn màn hình" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("presentation.png") });
  await stage.getByRole("link", { name: /Hoạt động trước/ }).click();
  await expect(stage.getByText("1 / 5", { exact: false })).toBeVisible();
  await expect(page).toHaveURL(/mode=present/);
  await stage.getByRole("link", { name: "Thoát trình chiếu" }).click();
  const readingStep = outline.getByRole("link").filter({ hasText: name });
  await readingStep.click();
  await expect(readingStep).toHaveAttribute("aria-current", "step");
  const selectedLesson = page.url();
  await page.getByText(`Giao hoạt động này · ${name}`, { exact: true }).click();
  await page.getByRole("button", { name: "Tạo link giao bài", exact: true }).click();
  const share = page.getByLabel("Link chia sẻ");
  await expect(share).toBeVisible();
  const resultUrl = page.url();
  const studentUrl = await share.inputValue();
  const student = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(new URL("?edit=1", activityUrl).toString(), { waitUntil: "networkidle" });
    await page.getByLabel("Nội dung đọc").fill("The draft source text has been changed since the assignment was made.");
    await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
    await expect(page.getByText("Đã lưu thay đổi.")).toBeVisible();
    const html = await (await student.goto(studentUrl))!.text();
    expect(html).not.toContain("PRIVATE TEACHER PLAN NOTE");
    expect(html).not.toContain("On Tuesdays");
    const begin = student.getByRole("button", { name: "Bắt đầu", exact: true });
    await expect(begin).toBeEnabled();
    await student.getByLabel("Biệt danh").fill("Reading B2");
    const start = student.waitForResponse(response => response.request().method() === "POST" && response.url() === studentUrl);
    await begin.click();
    const body = await (await start).text();
    expect(body).not.toContain('"answers"');
    expect(body).not.toContain("PRIVATE READING EXPLANATION");
    expect(body).not.toContain("PRIVATE TEACHER PLAN NOTE");
    const passage = student.getByText(/On Tuesdays, Lila feeds her rabbit/);
    await expect(passage).toBeVisible({ timeout: 15000 });
    await student.screenshot({ path: info.outputPath("reading-mobile.png") });
    await student.getByText("Ngữ liệu đọc", { exact: true }).click();
    await expect(passage).toBeHidden();
    await student.getByRole("button", { name: "She feeds her rabbit.", exact: true }).click();
    await student.getByRole("button", { name: "Tiếp theo", exact: true }).click();
    await student.getByText("Ngữ liệu đọc", { exact: true }).click();
    await expect(passage).toBeVisible();
    expect(await student.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await student.getByRole("button", { name: "They missed the bell.", exact: true }).click();
    await student.getByRole("button", { name: "Hoàn thành", exact: true }).click();
    await expect(student.getByText("1/2 điểm", { exact: true })).toBeVisible();
    await expect(student.getByText(/Xem lại câu sai/)).toHaveCount(0);
    await page.goto(selectedLesson);
    await expect(page.getByRole("link", { name, exact: true }).last()).toHaveAttribute("href", new URL(resultUrl).pathname);
    await page.goto(resultUrl);
    await expect(page.getByRole("row").filter({ hasText: "Reading B2" })).toContainText("1/2");
    const other = await browser.newPage();
    try {
      await login(other, true);
      const unauthorized = await other.goto(lessonUrl);
      expect(unauthorized?.status()).toBe(404);
      await expect(other.locator("body")).not.toContainText("PRIVATE TEACHER PLAN NOTE");
    } finally { await other.close(); }
  } finally {
    await student.close();
    await page.goto(resultUrl);
    await page.getByRole("button", { name: "Đóng bài tập", exact: true }).click();
  }
});

test("Grammar saves a valid alternative and only reveals a wrong answer with opted-in review", async ({ page, browser }, info) => {
  test.skip(!process.env.E2E_TEACHER_EMAIL || !["desktop", "safari"].includes(info.project.name), "Needs QuizStudy and desktop Chromium or WebKit.");
  test.setTimeout(100000);
  await login(page);
  await page.goto("/activities/new?grammar=have-got", { waitUntil: "networkidle" });
  await page.getByLabel("Tên hoạt động").fill(`[TEST B2 ${info.project.name}] Grammar ${Date.now()}`);
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  await page.getByRole("checkbox", { name: /xem câu sai/ }).check();
  await page.getByRole("button", { name: "Tạo link giao bài", exact: true }).click();
  const share = page.getByLabel("Link chia sẻ");
  await expect(share).toBeVisible();
  try {
    for (const response of ["Leo's got a kitten", "Leo have got a kitten"]) {
      const student = await browser.newPage({ viewport: { width: 820, height: 1180 } });
      try {
        const correct = response.includes("Leo's");
        const url = await share.inputValue();
        await student.goto(url);
        const begin = student.getByRole("button", { name: "Bắt đầu", exact: true });
        await expect(begin).toBeEnabled();
        await student.getByLabel("Biệt danh").fill(correct ? "Grammar alternative" : "Grammar wrong");
        const start = student.waitForResponse(result => result.request().method() === "POST" && result.url() === url);
        await begin.click();
        const body = await (await start).text();
        expect(body).not.toContain("Leo's got a kitten");
        expect(body).not.toContain('"explanation"');
        await student.getByRole("textbox", { name: "Câu trả lời" }).fill(response);
        await student.getByRole("button", { name: "Hoàn thành", exact: true }).click();
        await expect(student.getByText(correct ? "1/1 điểm" : "0/1 điểm", { exact: true })).toBeVisible();
        if (!correct) {
          await student.getByText(/Xem lại câu sai/).click();
          await expect(student.getByText(/có thể rút gọn/)).toBeVisible();
        }
      } finally { await student.close(); }
    }
    await page.reload();
    await expect(page.getByRole("row").filter({ hasText: "Grammar alternative" })).toContainText("1/1");
    await expect(page.getByRole("row").filter({ hasText: "Grammar wrong" })).toContainText("0/1");
  } finally {
    await page.getByRole("button", { name: "Đóng bài tập", exact: true }).click();
  }
});
