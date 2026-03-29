import { expect, test, type Page } from "@playwright/test";

async function addFoodEntry(page: Page, name: string, quantity: string, calories: string, protein: string, carbs: string, fats: string) {
  await page.getByLabel("Food Name").fill(name);
  await page.getByLabel("Quantity", { exact: true }).fill(quantity);
  await page.getByLabel("Calories").fill(calories);
  await page.getByLabel("Protein (g)").fill(protein);
  await page.getByLabel("Carbs (g)").fill(carbs);
  await page.getByLabel("Fats (g)").fill(fats);
  await page.getByRole("button", { name: "Add Entry" }).click();
  await expect(page.getByLabel("Food Name")).toHaveValue("");
}

function dateFromOffset(daysFromNow: number) {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

test.describe("Nutrition", () => {
  test("loads nutrition daily log page and logs a food entry", async ({ page }) => {
    const targetDate = dateFromOffset(1);

    await page.goto("/nutrition");
    await expect(page.getByRole("heading", { name: "Nutrition Daily Log" })).toBeVisible();
    await page.getByLabel("Log Date").fill(targetDate);

    await addFoodEntry(page, "Chicken breast", "150", "250", "35", "0", "5");
    await expect(page.getByRole("heading", { name: "History Table" })).toBeVisible();
    await page.getByLabel("End Date").fill(targetDate);
    await page.getByLabel("Start Date").fill(targetDate);
    await page.getByRole("button", { name: "Refresh" }).click();
    await expect(page.getByRole("cell", { name: targetDate })).toBeVisible();
  });

  test("supports goals and history rendering", async ({ page }) => {
    await page.goto("/settings");
    await page.getByLabel("Calorie Target (kcal)").fill("2200");
    await page.getByLabel("Protein Target (g)").fill("180");
    await page.getByLabel("Carbs Target (g)").fill("220");
    await page.getByLabel("Fats Target (g)").fill("70");
    await page.getByRole("button", { name: "Save Nutrition Goals" }).click();

    await page.goto("/nutrition/calories-macros");
    await expect(page.getByText("Balance")).toBeVisible();
    await expect(page.getByText("Set goals in Settings")).toHaveCount(0);
  });

  test("updates daily balance state from deficit to surplus", async ({ page }) => {
    const targetDate = dateFromOffset(3);
    const suffix = Date.now();

    await page.goto("/settings");
    await page.getByLabel("Calorie Target (kcal)").fill("2000");
    await page.getByLabel("Protein Target (g)").fill("180");
    await page.getByLabel("Carbs Target (g)").fill("200");
    await page.getByLabel("Fats Target (g)").fill("70");
    await page.getByRole("button", { name: "Save Nutrition Goals" }).click();

    await page.goto("/nutrition/calories-macros");
    await page.locator("#summary-date").fill(targetDate);
    await expect(page.getByText(/DEFICIT/i)).toBeVisible();
    await expect(page.getByText("Consumed Calories")).toBeVisible();

    await page.goto("/nutrition");
    await page.getByLabel("Log Date").fill(targetDate);
    await addFoodEntry(page, `Oats bowl ${suffix}`, "1", "300", "20", "40", "10");
    await addFoodEntry(page, `Large meal ${suffix}`, "1", "2200", "100", "220", "100");

    await page.goto("/nutrition/calories-macros");
    await page.locator("#summary-date").fill(targetDate);
    await expect(page.getByText(/SURPLUS/i)).toBeVisible();
    await expect(page.getByText("Remaining")).toBeVisible();
  });

  test("shows and hides history bodyweight overlay", async ({ page }) => {
    const targetDate = dateFromOffset(2);

    await page.goto("/nutrition");
    await page.getByLabel("Log Date").fill(targetDate);
    await addFoodEntry(page, "Yogurt", "1", "120", "12", "10", "4");
    await page.getByLabel("End Date").fill(targetDate);
    await page.getByLabel("Start Date").fill(targetDate);
    await page.getByRole("button", { name: "Refresh" }).click();

    await expect(page.getByRole("cell", { name: "-" }).first()).toBeVisible();

    const includeBodyWeight = page.getByRole("checkbox", { name: /Include body weight/i });
    await expect(includeBodyWeight).toBeChecked();
    await includeBodyWeight.uncheck();
    await expect(includeBodyWeight).not.toBeChecked();
    await page.getByRole("button", { name: "Refresh" }).click();
    await expect(page.getByText("hidden").first()).toBeVisible();
  });

  test("supports full saved foods CRUD flow", async ({ page }) => {
    await page.goto("/nutrition/foods");
    await expect(page.getByRole("heading", { name: "Nutrition Foods" })).toBeVisible();

    const suffix = Date.now();
    const initialName = `Saved Food ${suffix}`;
    const updatedName = `Saved Food Updated ${suffix}`;

    await page.getByLabel("Food Name").fill(initialName);
    await page.getByLabel("Default Quantity").fill("150");
    await page.getByLabel("Calories").fill("320");
    await page.getByLabel("Protein (g)").fill("28");
    await page.getByLabel("Carbs (g)").fill("22");
    await page.getByLabel("Fats (g)").fill("12");
    await page.getByRole("button", { name: "Create Food" }).click();

    await expect(page.getByRole("cell", { name: initialName })).toBeVisible();

    const createdRow = page.locator("tr", { hasText: initialName }).first();
    await createdRow.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Food Name").fill(updatedName);
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByRole("cell", { name: updatedName })).toBeVisible();

    const updatedRow = page.locator("tr", { hasText: updatedName }).first();
    await updatedRow.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByRole("cell", { name: updatedName })).toHaveCount(0);
  });

  test("redirects unauthenticated users to sign-in", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/nutrition");
    await expect(page).toHaveURL(/\/sign-in/);
    await context.close();
  });
});
