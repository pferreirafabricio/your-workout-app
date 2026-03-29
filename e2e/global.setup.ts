import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { chromium, expect, type FullConfig } from "@playwright/test";
import { createAccountAndSignIn } from "./helpers/auth";

const authFile = "playwright/.auth/user.json";

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL;
  if (typeof baseURL !== "string") {
    throw new Error("Playwright baseURL must be configured for global setup.");
  }

  await mkdir(dirname(authFile), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });

  await page.goto("/logout");
  await createAccountAndSignIn(page, "playwright-setup");
  await expect(page.getByText("Logged in as")).toBeVisible({ timeout: 10000 });
  await page.context().storageState({ path: authFile });

  await browser.close();
}