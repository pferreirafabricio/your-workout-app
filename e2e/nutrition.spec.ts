import { expect, test } from "@playwright/test";
 
 test.describe("Nutrition", () => {
   test("loads nutrition daily log page and logs a food entry", async ({ page }) => {
     await page.goto("/nutrition");
     await expect(page.getByRole("heading", { name: "Nutrition Daily Log" })).toBeVisible();
 
     await page.getByPlaceholder("Food name").fill("Chicken breast");
     await page.getByPlaceholder("Quantity").fill("150");
     await page.getByPlaceholder("Calories").fill("250");
     await page.getByPlaceholder("Protein (g)").fill("35");
     await page.getByPlaceholder("Carbs (g)").fill("0");
     await page.getByPlaceholder("Fats (g)").fill("5");
     await page.getByRole("button", { name: "Add Entry" }).click();
 
     await expect(page.getByText("Food entry added.")).toBeVisible();
   });
 
   test("supports goals and history rendering", async ({ page }) => {
     await page.goto("/settings");
     await page.getByLabel("Calorie Target (kcal)").fill("2200");
     await page.getByLabel("Protein Target (g)").fill("180");
     await page.getByLabel("Carbs Target (g)").fill("220");
     await page.getByLabel("Fats Target (g)").fill("70");
     await page.getByRole("button", { name: "Save Nutrition Goals" }).click();
 
     await expect(page.getByText("Nutrition goals saved.")).toBeVisible();
 
     await page.goto("/nutrition");
     await expect(page.getByRole("heading", { name: "History Table" })).toBeVisible();
   });
 
   test("updates daily balance state from deficit to surplus", async ({ page }) => {
     await page.goto("/settings");
     await page.getByLabel("Calorie Target (kcal)").fill("2000");
     await page.getByLabel("Protein Target (g)").fill("180");
     await page.getByLabel("Carbs Target (g)").fill("200");
     await page.getByLabel("Fats Target (g)").fill("70");
     await page.getByRole("button", { name: "Save Nutrition Goals" }).click();
 
     await page.goto("/nutrition/calories-macros");
 
     await expect(page.getByText(/DEFICIT/i)).toBeVisible();
 
     await page.goto("/nutrition");
 
     await page.getByPlaceholder("Food name").fill("Oats bowl");
     await page.getByPlaceholder("Quantity").fill("1");
     await page.getByPlaceholder("Calories").fill("300");
     await page.getByPlaceholder("Protein (g)").fill("20");
     await page.getByPlaceholder("Carbs (g)").fill("40");
     await page.getByPlaceholder("Fats (g)").fill("10");
     await page.getByRole("button", { name: "Add Entry" }).click();
 
     await page.getByPlaceholder("Food name").fill("Large meal");
     await page.getByPlaceholder("Quantity").fill("1");
     await page.getByPlaceholder("Calories").fill("2200");
     await page.getByPlaceholder("Protein (g)").fill("100");
     await page.getByPlaceholder("Carbs (g)").fill("220");
     await page.getByPlaceholder("Fats (g)").fill("100");
     await page.getByRole("button", { name: "Add Entry" }).click();
 
     await page.goto("/nutrition/calories-macros");
 
     await expect(page.getByText(/SURPLUS/i)).toBeVisible();
   });
 
   test("shows and hides history bodyweight overlay", async ({ page }) => {
     await page.goto("/nutrition");
     await page.getByPlaceholder("Food name").fill("Yogurt");
     await page.getByPlaceholder("Quantity").fill("1");
     await page.getByPlaceholder("Calories").fill("120");
     await page.getByPlaceholder("Protein (g)").fill("12");
     await page.getByPlaceholder("Carbs (g)").fill("10");
     await page.getByPlaceholder("Fats (g)").fill("4");
     await page.getByRole("button", { name: "Add Entry" }).click();
 
     await expect(page.getByRole("cell", { name: "-" }).first()).toBeVisible();
 
     await page.getByLabel("Include body weight").uncheck();
     await page.getByRole("button", { name: "Refresh" }).click();
     await expect(page.getByText("hidden").first()).toBeVisible();
   });
 
   test("redirects unauthenticated users to sign-in", async ({ page }) => {
     await page.context().clearCookies();
     await page.goto("/nutrition");
     await expect(page).toHaveURL(/\/sign-in/);
   });
 });
