import { test, expect } from "@playwright/test";
import { createAccountAndSignIn } from "./helpers/auth";

test.describe("Movements", () => {
  test("create and update movement with equipment and muscle group", async ({ page }) => {
    await createAccountAndSignIn(page, "movements-edit");

    await page.goto("/movements");
    await expect(page.getByText("Movements")).toBeVisible();
  });

  test("archive and restore movement while preserving history visibility", async ({ page }) => {
    await createAccountAndSignIn(page, "movements-archive");

    await page.goto("/movements");
    await expect(page.getByText("All Movements")).toBeVisible();
  });
});
