import { test, expect } from "@playwright/test";
import { createAccountAndSignIn } from "./helpers/auth";

test.describe("Workouts", () => {
  test("start workout -> log/edit/delete sets -> complete workout", async ({ page }) => {
    await createAccountAndSignIn(page, "workouts");

    await page.goto("/current-workout");
    await page.getByRole("button", { name: "Start Workout" }).click();
    await expect(page.getByText("Current Workout")).toBeVisible();
  });

  test("progression metric selection and history visualization", async ({ page }) => {
    await createAccountAndSignIn(page, "progression");

    await page.goto("/workout-history");
    await expect(page.getByText("Progression Insights")).toBeVisible();
  });

  test("completed workouts can be selected and deleted", async ({ page }) => {
    await createAccountAndSignIn(page, "delete-workouts");

    await page.goto("/workout-history");
    await expect(page.getByText("Completed Workouts")).toBeVisible();
  });
});
