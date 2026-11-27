import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import jsQR from "jsqr";
import readXlsxFile from "read-excel-file/node";

test.use({ trace: "off" });
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

async function signIn(page: Page, teacher: "TEACHER" | "OTHER") {
  await page.goto("/login");
  const password = page.getByLabel("Mật khẩu");
  await page.getByLabel("Email").fill(process.env[`E2E_${teacher}_EMAIL`]!);
  await password.fill(process.env[`E2E_${teacher}_PASSWORD`]!);
  try {
    await button(page, "Đăng nhập").click();
    await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible({ timeout: 45000 });
  } catch (error) {
    if (await password.isVisible()) await password.clear();
    throw error;
  }
}

async function importAndAssign(page: Page, paper: string) {
  await page.goto(`/samples/cambridge-flyers/${paper}`);
  await expect(button(page, "Bắt đầu")).toBeEnabled({ timeout: 15000 });
  await button(page, "Lưu vào thư viện giáo viên").click();
  await expect(button(page, "Tạo link giao bài")).toBeVisible({ timeout: 30000 });
  const activity = page.url();
  await button(page, "Tạo link giao bài").click();
  const share = page.getByLabel("Link chia sẻ");
  await expect(share).toBeVisible({ timeout: 30000 });
  return { activity, assignment: page.url(), play: await share.inputValue() };
}

test("anonymous requests for teaching PDFs and Excel must sign in", async ({ page }) => {
  const response = await page.request.post("/teaching/print/cambridge/flyers/pdf?paper=listening", {
    data: { version: "key" }, maxRedirects: 0,
  });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toContain("/login");
  const excel = await page.request.get("/results/export/xlsx", { maxRedirects: 0 });
  expect(excel.status()).toBe(307);
  expect(excel.headers().location).toContain("/login");
});

test("QuizStudy teacher prints Cambridge samples and a saved lesson", async ({ page, browser }, info) => {
  test.skip(!process.env.E2E_TEACHER_EMAIL || !process.env.E2E_OTHER_EMAIL, "QuizStudy synthetic teachers required");
  test.setTimeout(120000);
  await signIn(page, "TEACHER");
  for (const level of ["starters", "movers", "flyers"]) {
    await page.goto(`/samples/cambridge-${level}/reading`);
    await page.getByRole("link", { name: "In đề Cambridge" }).click();
    await button(page, "Xem trước PDF").click();
    await expect(page.getByTitle("Xem trước phiếu PDF")).toHaveAttribute("src", /^blob:/, { timeout: 30000 });
    expect(await page.locator("body").evaluate(body => body.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  if (info.project.name !== "desktop") return;
  await page.goto("/library/new?sample=routine");
  await page.getByLabel("Tên giáo án").fill("Giáo án tổng hợp · V1.6A");
  await page.getByLabel("Ghi chú riêng của giáo viên").fill("PRIVATE SYNTHETIC LESSON NOTE");
  await button(page, "Lưu giáo án").click();
  await expect(page.getByText("Đã lưu giáo án.")).toBeVisible();
  await page.getByRole("link", { name: "In giáo án", exact: true }).click();
  const pending = page.waitForEvent("download");
  await button(page, "Tải PDF").click();
  await (await pending).saveAs(info.outputPath("lesson.pdf"));
  const path = new URL(page.url()).pathname;
  const other = await browser.newPage();
  try {
    await signIn(other, "OTHER");
    expect((await other.request.post(path + "/pdf", { data: {} })).status()).toBe(404);
  } finally {
    await other.close();
  }
});

test("QuizStudy teaching workflow prints, scans and exports private results", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "desktop" || !process.env.E2E_TEACHER_EMAIL || !process.env.E2E_OTHER_EMAIL,
    "QuizStudy synthetic teachers required");
  test.setTimeout(240000);
  await signIn(page, "TEACHER");
  const student = await browser.newPage();
  const other = await browser.newPage();
  const assigned: string[] = [];
  try {
    const listening = await importAndAssign(page, "listening");
    assigned.push(listening.assignment);
    expect(new URL(listening.play).origin).toBe(new URL(listening.assignment).origin);
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await button(page, "Sao chép link").click();
    await expect(page.getByRole("status")).toHaveText("Đã sao chép link.");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(listening.play);
    await button(page, "Mở mã QR").click();
    for (const ext of ["PNG", "SVG"]) {
      const pending = page.waitForEvent("download");
      await page.getByRole("link", { name: `Tải QR ${ext}` }).click();
      const download = await pending;
      const path = info.outputPath(`assignment-qr.${ext.toLowerCase()}`);
      await download.saveAs(path);
      const { data, info: image } = await sharp(await readFile(path)).resize(720, 720, { kernel: "nearest" })
        .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect(jsQR(new Uint8ClampedArray(data), image.width, image.height)?.data).toBe(listening.play);
    }
    await page.evaluate(() => { window.print = () => {
      document.body.dataset.qaQrPrint = document.body.dataset.printAssignmentQr;
    }; });
    await button(page, "In mã QR").click();
    await expect(page.locator("body")).toHaveAttribute("data-qa-qr-print", "true");
    await button(page, "Trình chiếu QR").click();
    await expect(page.getByRole("dialog", { name: "Trình chiếu QR" })).toBeVisible();
    await page.screenshot({ path: info.outputPath("assignment-qr-presentation.png") });
    await button(page, "Thoát trình chiếu QR").click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await page.getByRole("link", { name: "In đề đã giao" }).click();
    const printPath = new URL(page.url()).pathname;
    await page.getByLabel("Tiêu đề").fill("Tiếng Việt · Flyers");
    await page.getByLabel("Tên học sinh").fill("Học sinh tổng hợp");
    await page.getByLabel("Hướng dẫn").fill("Listen carefully · /ˈtʃɪldrən/");
    await page.getByLabel("Cỡ chữ").selectOption("16");
    await page.getByLabel("In màu").uncheck();
    await button(page, "Xem trước PDF").click();
    await expect(page.locator('iframe[title="Xem trước phiếu PDF"]')).toHaveAttribute("src", /^blob:/, { timeout: 30000 });
    for (const [label, filename] of [
      ["Tải PDF", "flyers-worksheet.pdf"], ["Tải đáp án PDF", "flyers-key.pdf"], ["Tải transcript PDF", "flyers-transcript.pdf"],
    ]) {
      const pending = page.waitForEvent("download");
      await button(page, label).click();
      const path = info.outputPath(filename);
      await (await pending).saveAs(path);
      expect((await readFile(path)).subarray(0, 4).toString()).toBe("%PDF");
    }
    await student.goto(listening.play);
    await student.getByLabel("Biệt danh").fill("=1+1");
    await button(student, "Bắt đầu").click();
    await button(student, "Person 3").click();
    for (let i = 0; i < 24; i++) await button(student, "Tiếp theo").click();
    await button(student, "Nộp bài").click();
    await expect(student.getByText("1/25 điểm", { exact: true })).toBeVisible();

    const speaking = await importAndAssign(page, "speaking");
    assigned.push(speaking.assignment);
    await student.goto(speaking.play);
    await student.getByLabel("Biệt danh").fill("Synthetic Speaking QA");
    await button(student, "Bắt đầu").click();
    for (let i = 0; i < 3; i++) await button(student, "Tiếp theo").click();
    await button(student, "Nộp bài").click();
    await expect(student.getByText("Bài làm đã được lưu.")).toBeVisible();

    const ids = assigned.map(url => new URL(url).pathname.split("/").at(-1)!);
    const query = new URLSearchParams();
    for (const id of ids) query.append("assignment", id);
    const exportUrl = "/results/export/xlsx?" + query;
    await signIn(other, "OTHER");
    expect((await other.request.get(exportUrl)).status()).toBe(404);
    expect((await other.request.post(printPath + "/pdf", { data: { version: "key" } })).status()).toBe(404);
    const activityId = new URL(listening.activity).pathname.split("/").at(-1);
    expect((await other.request.post(`/teaching/print/activity/${activityId}/pdf`, { data: { version: "key" } })).status()).toBe(404);

    await page.goto("/results");
    await page.getByText("Xuất kết quả Excel", { exact: true }).click();
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
    for (const id of ids) await page.locator(`input[value="${id}"]`).check();
    await page.getByLabel("Từ ngày", { exact: true }).fill(today);
    await page.getByLabel("Đến ngày", { exact: true }).fill(today);
    const pending = page.waitForEvent("download");
    await button(page, "Tải XLSX").click();
    const workbookFile = info.outputPath("ket-qua.xlsx");
    await (await pending).saveAs(workbookFile);
    const sheets = await readXlsxFile(workbookFile);
    expect(sheets.map(sheet => sheet.sheet)).toEqual(["Tổng quan", "Kết quả", "Chi tiết trả lời"]);
    const results = sheets[1].data;
    expect(results.find(row => row[2] === "=1+1")?.slice(5, 8)).toEqual([1, 25, null]);
    expect(results.find(row => row[2] === "Synthetic Speaking QA")?.slice(5)).toEqual([null, null, null, 20, "Chờ chấm"]);
    expect(sheets[2].data.some(row => row[2] === "=1+1" && row[6] === "Sai")).toBe(true);
    const excluded = await page.request.get(exportUrl + "&to=2000-01-01");
    expect(excluded.status()).toBe(200);
    expect((await readXlsxFile(await excluded.body()))[1].data).toHaveLength(1);

    await page.goto(speaking.assignment);
    await page.getByRole("link", { name: "Synthetic Speaking QA" }).click();
    const marks = page.getByRole("spinbutton");
    await expect(marks).toHaveCount(5);
    for (const mark of await marks.all()) await mark.fill("2");
    await page.getByLabel("Nhận xét của giáo viên").fill("Synthetic teaching tools assessment.");
    await button(page, "Công bố kết quả").click();
    await expect(page.getByText(/Đã công bố/)).toBeVisible();
    const published = await page.request.get(exportUrl);
    expect(published.status()).toBe(200);
    const publishedBook = await readXlsxFile(await published.body());
    expect(publishedBook[1].data.find(row => row[2] === "Synthetic Speaking QA")?.slice(5))
      .toEqual([null, null, 10, 20, "Đã công bố"]);
    await page.goto(listening.assignment);
    const csv = page.waitForEvent("download");
    await page.getByRole("link", { name: "Tải CSV" }).click();
    expect(await readFile((await (await csv).path())!, "utf8")).toMatch(/"1","25"/);
    await button(page, "Đóng bài tập").click();
    await expect(button(page, "Mở lại bài tập")).toBeVisible();
    await student.goto(listening.play);
    await expect(student.getByText("Bài tập đã đóng hoặc hết hạn.")).toBeVisible();
  } finally {
    await student.close();
    await other.close();
    for (const assignment of assigned) {
      await page.goto(assignment);
      const close = button(page, "Đóng bài tập");
      if (await close.isVisible()) await close.click();
    }
  }
});
