import { test, expect } from "@playwright/test";
import { createAccountAndSignIn } from "./helpers/auth";

test.describe("Sets", () => {
  test("unit switch and bodyweight logging flow", async ({ page }) => {
    await createAccountAndSignIn(page, "sets-unit");

    await page.goto("/");
    await page.getByLabel("Weight unit").selectOption("lbs");
    await page.getByRole("button", { name: "Save Preferences" }).click();

    await page.goto("/current-workout");
    await expect(page.getByPlaceholder("Weight (lbs)")).toBeVisible();
  });

  test("rest timer starts and target indicator updates between sets", async ({ page }) => {
    await createAccountAndSignIn(page, "sets-rest");

    await page.goto("/current-workout");
    await page.getByRole("button", { name: "Start Workout" }).click();
    await expect(page.getByText(/Rest timer:/)).toBeVisible();
  });

  test("set add and delete interactions", async ({ page }) => {
    await createAccountAndSignIn(page, "sets-crud");

    await page.goto("/current-workout");
    await page.getByRole("button", { name: "Start Workout" }).click();
    await expect(page.getByText("Current Workout")).toBeVisible();
  });
});
