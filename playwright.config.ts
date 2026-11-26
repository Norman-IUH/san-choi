import { defineConfig, devices } from "@playwright/test";
const externalUrl = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  testDir: "./tests/browser",
  workers: 2,
  use: { baseURL: externalUrl ?? "http://localhost:3000", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
    { name: "tablet", use: { ...devices["Pixel 7"], viewport: { width: 820, height: 1180 } } },
  ],
  webServer: externalUrl ? undefined : { command: "npm run dev -- --hostname localhost", url: "http://localhost:3000", reuseExistingServer: !process.env.CI, timeout: 90000 },
});
