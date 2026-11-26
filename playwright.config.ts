import { defineConfig, devices } from "@playwright/test";
const externalUrl = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  testDir: "./tests/browser",
  workers: 2,
  use: { baseURL: externalUrl ?? "http://localhost:3000", trace: "retain-on-failure" },
  projects: [{ name: "desktop", use: devices["Desktop Chrome"] }, { name: "mobile", use: devices["Pixel 7"] }],
  webServer: externalUrl ? undefined : { command: "npm run dev -- --hostname localhost", url: "http://localhost:3000", reuseExistingServer: !process.env.CI, timeout: 90000 },
});
