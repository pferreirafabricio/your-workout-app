import { test as setup, expect } from "@playwright/test";
import { createAccountAndSignIn } from "./helpers/auth";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await page.goto("/logout");
  await createAccountAndSignIn(page, "playwright-setup");

  await expect(page.getByText("Logged in as")).toBeVisible({ timeout: 10000 });

  await page.context().storageState({ path: authFile });
});
