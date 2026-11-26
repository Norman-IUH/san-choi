import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { demoContent } from "../../lib/demo";
import { templateIds, templates } from "../../lib/game";

test("home displays demos without horizontal page overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Học mà chơi/ })).toBeVisible();
  await expect(page.locator(".template-card")).toHaveCount(templateIds.length);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});

for (const template of templateIds) {
  test(`${template} completes with the demo rules`, async ({ page }, info) => {
    const items = demoContent(template);
    const kind = templates[template].kind;
    await page.goto(`/demo/${template}`);
    const checkWidth = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
    const output = process.env.V13_SCREENSHOTS;
    const capture = async (state: string) => {
      if (!output) return;
      const dir = `${output}/${info.project.name}`;
      await mkdir(dir, { recursive: true });
      await page.screenshot({ path: `${dir}/${template}-${state}.png`, fullPage: true, animations: "disabled" });
    };
    await checkWidth();
    await capture("start");
    await page.getByRole("button", { name: "Bắt đầu" }).click();
    await page.locator(".game-stage > .play-stack").waitFor();
    await checkWidth();
    await capture("play");
    if (template === "match-up" || template === "group-sort") {
      for (const item of items) {
        await page.getByRole("group", { name: "Thẻ cần ghép" }).getByRole("button", { name: item.prompt, exact: true }).click();
        await page.getByRole("group", { name: template === "group-sort" ? "Nhóm" : "Đáp án ghép" })
          .getByRole("button", { name: item.answers[0], exact: true }).click();
      }
      await page.getByRole("button", { name: "Hoàn thành" }).click();
    } else if (template === "open-box") {
      for (const [i, item] of items.entries()) {
        await page.getByRole("button", { name: `Hộp ${i + 1}` }).click();
        await expect(page.getByText(item.prompt)).toBeVisible();
      }
      await page.getByRole("button", { name: "Hoàn thành" }).click();
    } else {
      for (const [i, item] of items.entries()) {
        if (template === "gameshow" && i === 0) await page.getByRole("button", { name: "Nhân đôi điểm câu này" }).click();
        if (template === "wheel") await page.getByRole("button", { name: "Quay vòng" }).click();
        if (template === "flash-cards") {
          await page.getByRole("button", { name: new RegExp(item.prompt) }).press("Enter");
          await expect(page.getByRole("button", { name: new RegExp(item.answers[0]) })).toBeVisible();
        }
        if (kind === "choice" || template === "find-match")
          for (const answer of item.answers) await page.getByRole("button", { name: answer, exact: true }).click();
        if (kind === "blank") await page.getByLabel("Từ cần điền").fill(item.answers[0]);
        if (kind === "sequence" || kind === "word")
          for (const answer of kind === "sequence" ? item.answers : Array.from(item.answers[0]))
            await page.locator(".options").getByRole("button", { name: answer, exact: true }).and(page.locator(":enabled")).first().click();
        await page.getByRole("button", { name: i + 1 === items.length ? "Hoàn thành" : "Tiếp theo" }).click();
      }
    }
    await expect(page.getByRole("heading", { name: "Hoàn thành!" })).toBeVisible();
    await checkWidth();
    await capture("result");
    const maxScore = items.length + Number(template === "gameshow");
    if (kind !== "prompt" && template !== "flash-cards") await expect(page.getByText(`${maxScore}/${maxScore} điểm`)).toBeVisible();
    await page.getByRole("button", { name: "Chơi lại" }).click();
    await expect(page.getByRole("button", { name: "Bắt đầu" })).toBeVisible();
  });
}
