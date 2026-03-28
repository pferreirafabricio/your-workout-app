import { test, expect } from "@playwright/test";

test.describe("Auth lockout", () => {
  test("locks account after repeated failed sign-ins and shows retry window", async ({ page }) => {

    await page.goto("/sign-in");

    for (let i = 0; i < 5; i += 1) {
      await page.getByLabel("Email").fill("lockout-user@example.com");
      await page.getByLabel("Password").fill("incorrect-password");
      await page.getByRole("button", { name: "Sign in" }).click();
    }

    await expect(page.getByText(/Too many failed attempts/)).toBeVisible();
  });
});
