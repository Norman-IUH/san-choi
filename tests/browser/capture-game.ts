import { mkdir } from "node:fs/promises";
import { expect, type Page, type TestInfo } from "@playwright/test";

export async function captureGame(page: Page, info: TestInfo, template: string, state: string) {
  const root = process.env.V14D_SCREENSHOTS;
  if (!root) return;
  if (state === "start") await expect(page.getByRole("button", { name: "Bắt đầu" })).toBeEnabled();
  const folder = `${root}/${info.project.name}`;
  await mkdir(folder, { recursive: true });
  await page.screenshot({ path: `${folder}/${template}-${state}.png`, fullPage: true, animations: "disabled" });
}
