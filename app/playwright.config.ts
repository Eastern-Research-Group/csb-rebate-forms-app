import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const authFile = path.join(__dirname, "./playwright/.auth/user.json");

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "Chromium",
      use: { ...devices["Desktop Chrome"], storageState: authFile },
      dependencies: ["Setup"],
    },
    {
      name: "Firefox",
      use: { ...devices["Desktop Firefox"], storageState: authFile },
      dependencies: ["Setup"],
    },
    // {
    //   name: "Webkit",
    //   use: { ...devices["Desktop Safari"], storageState: authFile },
    //   dependencies: ["Setup"],
    // },
  ],
  webServer: {
    command: "npm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
