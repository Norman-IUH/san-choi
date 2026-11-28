import {expect,test,type Page} from "@playwright/test";
import {createServer} from "node:http";
import type {AddressInfo} from "node:net";
test.use({trace:"off",actionTimeout:18000});
const button=(page:Page,name:string)=>page.getByRole("button",{name,exact:true});
const available=()=>Boolean(process.env.E2E_TEACHER_EMAIL && process.env.E2E_OTHER_EMAIL);

async function login(page:Page,other=false) {
  const label=other ? "OTHER" : "TEACHER";
  await page.goto("/login");
  const password=page.getByLabel("Mật khẩu");
  await page.getByLabel("Email").fill(process.env["E2E_"+label+"_EMAIL"]!);
  await password.fill(process.env["E2E_"+label+"_PASSWORD"]!);
  try {
    await button(page,"Đăng nhập").click();
    await expect(page.getByRole("heading",{name:"Hoạt động của tôi"})).toBeVisible({timeout:45000});
  } catch(error) {if(await password.isVisible()) await password.clear();throw error;}
}

async function generateQuiz(page:Page,title:string) {
  await page.goto("/activities/generate");
  await page.getByLabel("Tên bản nháp").fill(title);
  await page.getByLabel("Nguồn nội dung").selectOption("words");
  await page.getByLabel("Số câu").fill("3");
  await page.getByLabel("Mỗi dòng một từ").fill("cat | mèo\ndog | chó\nbird | chim");
  await button(page,"Tạo bản nháp để duyệt").click();
  await expect(page.getByRole("heading",{name:title,exact:true})).toBeVisible();
  await expect(page.getByText(/Bản nháp/).first()).toBeVisible();
  await expect(page.getByLabel("Câu hỏi hoặc gợi ý").first()).toHaveValue("mèo");
}

test("QuizStudy teacher-paced Realtime commands, reconnect and authoritative ranking",async({page,browser},info)=>{
  test.skip(info.project.name!=="desktop" || !available(),"Requires synthetic QuizStudy teachers");
  test.setTimeout(150000);
  await login(page);
  await generateQuiz(page,"Live QA · Animals");
  await button(page,"Xuất bản").click();
  await expect(page.getByText("Tạo phòng trực tiếp",{exact:true})).toBeVisible();
  await page.getByText("Tạo phòng trực tiếp",{exact:true}).click();
  await expect(page.getByLabel("Hiện bảng vinh danh cuối phòng")).not.toBeChecked();
  await button(page,"Mở phòng").click();
  const share=page.getByLabel("Link chia sẻ");
  await expect(share).toBeVisible();
  const room=page.url(), invite=await share.inputValue();
  await button(page,"Mở mã QR").click();
  await expect(page.getByRole("img",{name:"Mã QR bài giao"})).toBeVisible();
  const first=await browser.newPage(), second=await browser.newPage(), other=await browser.newPage();
  try {
    await Promise.all([first,second].map(async guest=>{
      await guest.goto(invite);
      await expect(guest.getByRole("heading",{name:"Tham gia lớp trực tiếp"})).toBeVisible();
      await button(guest,"Tham gia").click();
      await button(guest,"Em đã sẵn sàng").click();
      await expect(guest.getByText("Đã kết nối trực tiếp")).toBeVisible({timeout:12000});
    }));
    await expect(page.getByText("Sẵn sàng",{exact:true}).locator("..")).toContainText("2");
    await button(page,"Bắt đầu phòng").click();
    await expect(first.getByRole("heading",{name:"Câu 1/3 · mèo"})).toBeVisible({timeout:4500});
    await expect(first.getByText("Đã nhận cập nhật trực tiếp")).toBeVisible({timeout:4500});
    await first.context().setOffline(true);
    await button(page,"Tạm dừng").click();
    await expect(second.getByRole("status").filter({hasText:"Tạm dừng"})).toBeVisible();
    await first.context().setOffline(false);
    await expect(first.getByRole("status").filter({hasText:"Tạm dừng"})).toBeVisible({timeout:20000});
    await button(page,"Tiếp tục").click();
    await button(first,"cat").click();
    await button(first,"Gửi câu trả lời").click();
    await expect(first.getByText("Đã lưu câu trả lời.",{exact:false})).toBeVisible();
    await first.reload();
    await expect(button(first,"Gửi câu trả lời")).toBeDisabled();
    await button(second,"dog").click();
    await button(second,"Gửi câu trả lời").click();
    await expect(page.getByText("Câu trả lời ở câu này",{exact:true}).locator("..")).toContainText("2");
    await button(page,"Chuyển câu").click();
    await expect(first.getByRole("heading",{name:"Câu 2/3 · chó"})).toBeVisible();
    await button(page,"Bật bảng vinh danh").click();
    await button(page,"Kết thúc phòng").click();
    await expect(first.getByRole("heading",{name:"Bảng vinh danh"})).toBeVisible();
    await expect(first.getByText("Hạng 1 · Bạn 1",{exact:true}).or(first.getByText("Hạng 1 · Bạn 2",{exact:true}))).toBeVisible();
    await expect(first.getByText("Em trả lời đúng 1/3 câu trong phòng này.")).toBeVisible();
    await expect(first.getByText(/^Hạng /)).toHaveCount(1);
    await login(other,true);
    expect((await other.goto(room))?.status()).toBe(404);
  } finally {for(const guest of [first,second,other]) await guest.close();}
});

test("QuizStudy class-only student pace keeps team play separate from academic results",async({page,browser},info)=>{
  test.skip(info.project.name!=="desktop" || !available(),"Requires synthetic QuizStudy teachers");
  test.setTimeout(150000);
  await login(page);
  await page.goto("/classrooms");
  await page.getByText("Tạo lớp học",{exact:true}).click();
  const name="Live Synthetic Group "+Date.now();
  await page.getByRole("textbox",{name:"Tên lớp",exact:true}).fill(name);
  await button(page,"Lưu lớp học").click();
  await expect(page.getByRole("heading",{name,exact:true})).toBeVisible();
  const classId=new URL(page.url()).pathname.split("/").at(-1)!;
  await page.getByText("Thêm học sinh",{exact:true}).click();
  await page.getByRole("textbox",{name:"Tên học sinh",exact:true}).fill("Học sinh mẫu Live QA");
  await button(page,"Thêm vào lớp").click();
  await page.getByRole("link",{name:/^Học sinh mẫu Live QA ·/}).click();
  await expect(page.getByRole("heading",{name:"Học sinh mẫu Live QA",exact:true})).toBeVisible();
  const student=page.url();
  await button(page,"Cấp mã mới").click();
  const personal=await page.getByLabel("Mã cá nhân").inputValue();
  await generateQuiz(page,"Live Student-paced QA");
  await button(page,"Xuất bản").click();
  await page.getByText("Tạo phòng trực tiếp",{exact:true}).click();
  await page.getByLabel("Nhịp chơi").selectOption("student");
  await page.getByLabel("Người tham gia").selectOption(classId);
  await page.getByLabel("Hình thức").selectOption("teams");
  await page.getByLabel("Hiện bảng vinh danh cuối phòng").check();
  await button(page,"Mở phòng").click();
  const share=page.getByLabel("Link chia sẻ");
  await expect(share).toBeVisible();
  const guest=await browser.newPage({viewport:{width:390,height:844}});
  try {
    await guest.goto(await share.inputValue());
    await button(guest,"Tham gia").click();
    await expect(guest.getByRole("alert").filter({hasText:"mã cá nhân hợp lệ"})).toBeVisible();
    await guest.getByLabel("Mã cá nhân nếu phòng thuộc một lớp").fill(personal);
    await button(guest,"Tham gia").click();
    await button(guest,"Em đã sẵn sàng").click();
    await expect(guest.getByText("Em thuộc Đội Xanh.")).toBeVisible();
    await button(page,"Bắt đầu phòng").click();
    for(const [heading,answer] of [["Câu 1/3 · mèo","cat"],["Câu 2/3 · chó","dog"],["Câu 3/3 · chim","bird"]]) {
      await expect(guest.getByRole("heading",{name:heading,exact:true})).toBeVisible();
      await button(guest,answer).click();
      await button(guest,"Gửi câu trả lời").click();
    }
    await expect(guest.getByText("Em đã hoàn thành tất cả câu hỏi.")).toBeVisible();
    await button(page,"Kết thúc phòng").click();
    await expect(guest.getByText("Hạng 1 · Đội Xanh")).toBeVisible();
    await expect(guest.getByText("4 điểm",{exact:false})).toBeVisible();
    await expect(guest.getByText("Chúc mừng!",{exact:false})).toBeVisible();
    await page.goto(student);
    await expect(page.getByRole("link",{name:"Live Student-paced QA",exact:true})).toBeVisible();
    await expect(page.getByText("Chưa có bài giao phù hợp.")).toBeVisible();
  } finally {await guest.close();}
});

test("QuizStudy draft edit, public embed across origins, and private framing policy",async({page,browser},info)=>{
  test.skip(info.project.name!=="desktop" || !available(),"Requires synthetic QuizStudy teachers");
  test.setTimeout(110000);
  await login(page);
  await generateQuiz(page,"Embed QA · Animals");
  const id=new URL(page.url()).pathname.split("/").at(-1);
  expect((await page.request.get("/embed/"+id)).status()).toBe(404);
  await page.getByLabel("Câu hỏi hoặc gợi ý").first().fill("Con mèo");
  await page.getByLabel("Quyền xem").selectOption("public");
  await button(page,"Xuất bản").click();
  await page.getByText("Nhúng hoạt động",{exact:true}).click();
  const iframe=await page.getByLabel("Mã iframe").inputValue();
  const origin=new URL(page.url()).origin;
  expect(iframe).toContain(origin+"/embed/"+id);
  const remote=await browser.newPage({viewport:{width:390,height:844}});
  const site=createServer((_,response)=>{
    response.setHeader("Content-Type","text/html; charset=utf-8");
    response.end(iframe);
  });
  try {
    await new Promise<void>((resolve,reject)=>site.once("error",reject).listen(0,"localhost",resolve));
    await remote.goto(`http://localhost:${(site.address() as AddressInfo).port}/`);
    const frame=remote.frameLocator("iframe");
    await frame.getByRole("button",{name:"Bắt đầu",exact:true}).click();
    await expect(frame.getByRole("heading",{name:"Con mèo",exact:true})).toBeVisible();
    expect(await remote.locator("iframe").evaluate(el=>el.getBoundingClientRect().width)).toBeLessThan(391);
    expect((await page.request.get("/classrooms")).headers()["content-security-policy"]).toBe("frame-ancestors 'none'");
    expect((await page.request.get("/embed/"+id)).headers()["content-security-policy"]).toBe("frame-ancestors *");
    await page.getByRole("link",{name:"Chỉnh sửa",exact:true}).click();
    await page.getByLabel("Quyền xem").selectOption("unlisted");
    await button(page,"Xuất bản").click();
    await expect(page).toHaveURL(/\?saved=1$/);
    expect((await page.request.get("/embed/"+id)).status()).toBe(404);
    expect((await page.request.get("/resource/"+id)).status()).toBe(200);
  } finally {await remote.close(); site.close();}
});
