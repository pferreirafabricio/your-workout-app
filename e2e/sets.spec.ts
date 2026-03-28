import { test, expect } from "@playwright/test";
 
 test.describe("Sets", () => {
   test("unit switch and bodyweight logging flow", async ({ page }) => {
     await page.goto("/");
     await page.getByLabel("Weight unit").selectOption("lbs");
     await page.getByRole("button", { name: "Save Preferences" }).click();
 
     await page.goto("/current-workout");
     await expect(page.getByPlaceholder("Weight (lbs)")).toBeVisible();
   });
 
   test("rest timer starts and target indicator updates between sets", async ({ page }) => {
     await page.goto("/current-workout");
     await page.getByRole("button", { name: "Start Workout" }).click();
     await expect(page.getByText(/Rest timer:/)).toBeVisible();
   });
 
   test("set add and delete interactions", async ({ page }) => {
     await page.goto("/current-workout");
     await page.getByRole("button", { name: "Start Workout" }).click();
     await expect(page.getByText("Current Workout")).toBeVisible();
   });
 
   test("bodyweight movement auto-fills and disables weight input", async ({ page }) => {
     await page.goto("/");
     await page.getByLabel("Weight unit").selectOption("lbs");
     await page.getByRole("button", { name: "Save Preferences" }).click();
 
     await page.getByLabel("Bodyweight (lbs)").fill("180");
     await page.getByRole("button", { name: "Record" }).click();
 
     const movementName = `Pull-Up-${Date.now()}`;
     await page.goto("/movements");
     await page.getByPlaceholder("Movement name (e.g. Bench Press)").fill(movementName);
     await page.locator("form").filter({ hasText: "Add New Movement" }).locator("select").first().selectOption("BODYWEIGHT");
     await page.locator("form").filter({ hasText: "Add New Movement" }).locator("button[type='submit']").click();
 
     const movementName2 = `Bench Press-${Date.now()}`;
     await page.getByPlaceholder("Movement name (e.g. Bench Press)").fill(movementName2);
     await page.locator("form").filter({ hasText: "Add New Movement" }).locator("select").first().selectOption("WEIGHTED");
     await page.locator("form").filter({ hasText: "Add New Movement" }).locator("button[type='submit']").click();
 
     await page.goto("/current-workout");
     await page.getByRole("button", { name: "Start Workout" }).click();
 
     await page.locator("form").filter({ hasText: "Select movement" }).locator("select").first().selectOption({ label: movementName });
     const weightInput = page.locator("form").filter({ hasText: "Select movement" }).locator("input[type='number']").first();
     await expect(weightInput).toBeDisabled();
     await expect(weightInput).toHaveValue("180");
 
     await page.locator("form").filter({ hasText: "Select movement" }).locator("select").first().selectOption({ label: movementName2 });
     await expect(weightInput).toBeEnabled();
     await expect(weightInput).toHaveValue("");
   });
 
   test("bodyweight movement without entries keeps weight disabled and errors on submit", async ({ page }) => {
     const movementName = `Push-Up-${Date.now()}`;
     await page.goto("/movements");
     await page.getByPlaceholder("Movement name (e.g. Bench Press)").fill(movementName);
     await page.locator("form").filter({ hasText: "Add New Movement" }).locator("select").first().selectOption("BODYWEIGHT");
     await page.locator("form").filter({ hasText: "Add New Movement" }).locator("button[type='submit']").click();
 
     await page.goto("/current-workout");
     await page.getByRole("button", { name: "Start Workout" }).click();
 
     const workoutForm = page.locator("form").filter({ hasText: "Select movement" });
     await workoutForm.locator("select").first().selectOption({ label: movementName });
 
     const weightInput = workoutForm.locator("input[type='number']").first();
     await expect(weightInput).toBeDisabled();
     await expect(weightInput).toHaveValue("");
 
     await page.getByPlaceholder("Reps").fill("12");
     await workoutForm.locator("button[type='submit']").click();
 
     await expect(page.getByText("Record bodyweight first before adding a bodyweight set.")).toBeVisible();
   });
 });
