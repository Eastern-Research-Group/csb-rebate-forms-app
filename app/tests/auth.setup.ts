import path from "node:path";
import { test, expect } from "@playwright/test";
import "dotenv/config";

const { TEST_USERNAME, TEST_PASSWORD } = process.env;
const authFile = path.join(__dirname, "../playwright/.auth/user.json");

test("log in", async ({ page }) => {
  await page.goto("http://localhost:3000/welcome");

  await page.getByRole("link", { name: "Sign in" }).click();
  await page.getByLabel("Username").fill(TEST_USERNAME || "");
  await page.getByLabel("Password").fill(TEST_PASSWORD || "");
  await page.getByRole("button", { name: "Login" }).click();

  await page.waitForURL("http://localhost:3000/");

  const heading = page.getByRole("heading", {
    name: "Clean School Bus Rebate Forms",
  });
  await expect(heading).toBeVisible();

  await page.context().storageState({ path: authFile });
});
