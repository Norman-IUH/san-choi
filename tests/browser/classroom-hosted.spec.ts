import { expect, test, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import readXlsxFile from "read-excel-file/node";
import writeXlsxFile from "write-excel-file/node";

test.use({ trace: "off", actionTimeout: 15000 });
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

async function signIn(page: Page, role: "TEACHER" | "OTHER") {
  await page.goto("/login");
  const password = page.getByLabel("Mật khẩu");
  await page.getByLabel("Email").fill(process.env[`E2E_${role}_EMAIL`]!);
  await password.fill(process.env[`E2E_${role}_PASSWORD`]!);
  try {
    await button(page, "Đăng nhập").click();
    await expect(page.getByRole("heading", { name: "Hoạt động của tôi" })).toBeVisible({ timeout: 45000 });
  } catch (failure) {
    if (await password.isVisible()) await password.clear();
    throw failure;
  }
}

test("QuizStudy classroom roster, personal attempts, rubric and private reports", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "desktop" || !process.env.E2E_TEACHER_EMAIL || !process.env.E2E_OTHER_EMAIL,
    "Requires QuizStudy synthetic teachers.");
  test.setTimeout(240000);
  await signIn(page, "TEACHER");
  const assignmentUrls: string[] = [];
  const first = await browser.newPage();
  const second = await browser.newPage();
  const other = await browser.newPage();
  try {
    const name = "V16B Synthetic Classroom " + Date.now();
    await page.goto("/classrooms");
    await page.getByText("Tạo lớp học", { exact: true }).click();
    await page.getByRole("textbox", { name: "Tên lớp", exact: true }).fill(name);
    await page.locator('details select[name="level"]').selectOption("Flyers");
    await page.getByLabel("Lịch học").fill("Thứ bảy");
    await page.getByLabel("Khóa học").fill("English QA");
    await button(page, "Lưu lớp học").click();
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    const classroom = page.url();
    const classId = new URL(classroom).pathname.split("/").at(-1)!;
    await page.getByText("Thêm học sinh", { exact: true }).click();
    await page.getByLabel("Danh sách CSV/XLSX").setInputFiles({ name: "roster.csv", mimeType: "text/csv",
      buffer: Buffer.from("name\nMinh QA\nMinh QA\n") });
    await button(page, "Nhập danh sách").click();
    await expect(page.getByText("Đã thêm 2 học sinh.")).toBeVisible();
    const learners = await page.getByRole("link", { name: /^Minh QA ·/ }).evaluateAll(rows => rows.map(row => (row as HTMLAnchorElement).href));
    expect(new Set(learners).size).toBe(2);
    await page.getByLabel("Giữ danh sách học sinh").check();
    await button(page, "Nhân bản lớp").click();
    await expect(page.getByRole("heading", { name: name + " (bản sao)", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Minh QA ·/ })).toHaveCount(2);
    await page.getByText("Thêm học sinh", { exact: true }).click();
    await page.getByLabel("Danh sách CSV/XLSX").setInputFiles({ name: "roster.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: await writeXlsxFile([["Họ tên"], ["Hồ sơ XLSX QA"]]).toBuffer() });
    await button(page, "Nhập danh sách").click();
    await expect(page.getByRole("link", { name: /^Hồ sơ XLSX QA ·/ })).toBeVisible();
    const codes = [];
    for (const learner of learners) {
      await page.goto(learner);
      await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: name + " (bản sao)", exact: true })).toBeVisible();
      await button(page, "Cấp mã mới").click();
      await expect(page.getByLabel("Mã cá nhân")).toBeVisible();
      codes.push(await page.getByLabel("Mã cá nhân").inputValue());
    }
    await page.goto(learners[0]);
    await page.getByText("Chỉnh sửa hồ sơ", { exact: true }).click();
    await page.getByLabel("Nhận xét riêng").fill("PRIVATE SYNTHETIC TEACHER NOTE");
    await button(page, "Lưu hồ sơ").click();
    await expect(page.getByRole("complementary").getByText("PRIVATE SYNTHETIC TEACHER NOTE", { exact: true })).toBeVisible();
    const assign = async (paper: string, part: number, restricted = false) => {
      await page.goto(`/samples/cambridge-flyers/${paper}?part=${part}`);
      await button(page, "Lưu vào thư viện giáo viên").click();
      await expect(button(page, "Tạo link giao bài")).toBeVisible({ timeout: 30000 });
      await page.getByLabel("Giao cho").selectOption(classId);
      if (restricted) {
        await page.getByLabel("Người nhận").selectOption("selected");
        const id = new URL(learners[0]).pathname.split("/").at(-1);
        await page.locator(`input[name="recipient"][value="${id}"]`).check();
      } else await page.getByLabel("Số lượt làm tối đa").fill("2");
      await button(page, "Tạo link giao bài").click();
      await expect(page.getByLabel("Link chia sẻ")).toBeVisible({ timeout: 30000 });
      assignmentUrls.push(page.url());
      return { teacher: page.url(), play: await page.getByLabel("Link chia sẻ").inputValue() };
    };
    const listening = await assign("listening", 1);
    await button(page, "Mở mã QR").click();
    await expect(page.getByRole("img", { name: "Mã QR bài giao" })).toBeVisible();
    await expect(page.getByText("Chưa làm", { exact: true })).toHaveCount(2);
    const enter = async (target: Page, play: string, code: string) => {
      await target.goto(play);
      await target.getByLabel("Mã tham gia cá nhân").fill(code);
      await button(target, "Bắt đầu").click();
    };
    await enter(first, listening.play, "AAAAAAAAAAAAAAAAAAAA");
    await expect(first.getByRole("alert").filter({ hasText: "Mã cá nhân không hợp lệ" })).toBeVisible();
    await expect(first.getByText("Minh QA", { exact: true })).toHaveCount(0);
    await enter(first, listening.play, codes[0]);
    await expect(button(first, "Person 3")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("cell", { name: "Đang làm", exact: true })).toHaveCount(1);
    const listeningFinish = async (target: Page, correct: boolean) => {
      if (correct) await button(target, "Person 3").click();
      for (let i = 0; i < 4; i++) await button(target, "Tiếp theo").click();
      await button(target, "Nộp bài").click();
      await expect(target.getByText(correct ? "1/5 điểm" : "0/5 điểm", { exact: true })).toBeVisible();
    };
    await listeningFinish(first, true);
    await enter(second, listening.play, codes[1]);
    await listeningFinish(second, false);
    await enter(first, listening.play, codes[0]);
    await listeningFinish(first, false);
    await enter(first, listening.play, codes[0]);
    await expect(first.getByRole("alert").filter({ hasText: "hết số lượt" })).toBeVisible();

    const speaking = await assign("speaking", 2, true);
    await enter(second, speaking.play, codes[1]);
    await expect(second.getByRole("alert").filter({ hasText: "Mã cá nhân không hợp lệ" })).toBeVisible();
    await enter(first, speaking.play, codes[0]);
    await button(first, "Nộp bài").click();
    await expect(first.getByText("Bài làm đã được lưu.")).toBeVisible();
    expect((await first.request.get(speaking.play + "/review")).status()).toBe(404);
    await page.goto(speaking.teacher);
    await expect(page.getByRole("cell", { name: "Chờ chấm", exact: true })).toBeVisible();
    const classroomExport = `/classrooms/export?classroom=${classId}`;
    const studentId = new URL(learners[0]).pathname.split("/").at(-1);
    const studentExport = `/classrooms/export?student=${studentId}`;
    const excel = await page.request.get(classroomExport + "&format=xlsx");
    expect(excel.status()).toBe(200);
    const sheets = await readXlsxFile(await excel.body());
    expect(sheets.map(sheet => sheet.sheet)).toEqual(["Danh sách", "Bảng điểm", "Tiến độ"]);
    expect(sheets[0].data.slice(1).map(row => row[0])).toEqual(["Minh QA", "Minh QA"]);
    expect(new Set(sheets[1].data.slice(1).map(row => row[1])).size).toBe(2);
    expect(sheets[1].data.find(row => row[11] === "Chờ chấm")?.slice(7, 11)).toEqual([null, null, null, 20]);
    expect(sheets[1].data.filter(row => row[1] === studentId && row[7] === 0)).toHaveLength(1);
    expect(sheets[2].data.find(row => row[0] === "A2 Flyers · Speaking · Part 2")?.slice(1, 4)).toEqual([null, null, 1]);
    await writeFile(info.outputPath("classroom.xlsx"), await excel.body());
    const filtered = await page.request.get(studentExport + "&format=xlsx&skill=Listening");
    expect((await readXlsxFile(await filtered.body()))[1].data).toHaveLength(3);
    const past = await page.request.get(studentExport + "&format=xlsx&to=2000-01-01");
    expect((await readXlsxFile(await past.body()))[1].data).toHaveLength(1);
    for (const [url, filename] of [
      [classroomExport + "&format=pdf", "classroom.pdf"],
      [studentExport + "&format=pdf", "teacher-student.pdf"],
      [studentExport + "&format=pdf&audience=parent", "parent.pdf"],
    ]) {
      const response = await page.request.get(url);
      expect(response.status()).toBe(200);
      expect(response.headers()["cache-control"]).toBe("private, no-store");
      expect((await response.body()).subarray(0, 4).toString()).toBe("%PDF");
      await writeFile(info.outputPath(filename), await response.body());
    }
    await page.getByRole("link", { name: /Tự động — · Thủ công — · Chờ chấm/ }).click();
    const marks = page.getByRole("spinbutton");
    await expect(marks).toHaveCount(5);
    for (const mark of await marks.all()) await mark.fill("2");
    await button(page, "Công bố kết quả").click();
    await expect(page.getByText(/Chấm thủ công · Đã công bố/)).toBeVisible();
    const reviewed = await page.request.get(studentExport + "&format=xlsx");
    expect((await readXlsxFile(await reviewed.body()))[1].data.find(row => row[11] === "Đã công bố")?.slice(9, 12))
      .toEqual([10, 20, "Đã công bố"]);
    await page.goto(learners[0]);
    await expect(page.getByRole("heading", { name: "Cambridge theo từng Part" })).toBeVisible();
    await expect(page.locator("span").filter({ hasText: /^A2 Flyers · Listening · Part 1$/ })).toBeVisible();
    await button(page, "Thu hồi mã").click();
    await expect(page.getByText("Đã thu hồi mã.")).toBeVisible();
    await enter(first, listening.play, codes[0]);
    await expect(first.getByRole("alert").filter({ hasText: "Mã cá nhân không hợp lệ" })).toBeVisible();
    await signIn(other, "OTHER");
    expect((await other.request.get(classroomExport + "&format=xlsx")).status()).toBe(404);
    expect((await other.request.get(studentExport + "&format=pdf")).status()).toBe(404);
    expect((await other.goto(learners[0]))?.status()).toBe(404);
  } finally {
    for (const child of [first, second, other]) await child.close();
    for (const assignment of assignmentUrls) {
      await page.goto(assignment);
      if (await button(page, "Đóng bài tập").isVisible()) await button(page, "Đóng bài tập").click();
    }
  }
});
