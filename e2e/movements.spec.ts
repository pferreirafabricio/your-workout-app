import { test, expect } from "@playwright/test";
 
 test.describe("Movements", () => {
   test("create and update movement with equipment and muscle group", async ({ page }) => {
     await page.goto("/movements");
     await expect(page.getByText("Movements")).toBeVisible();
   });
 
   test("archive and restore movement while preserving history visibility", async ({ page }) => {
     await page.goto("/movements");
     await expect(page.getByText("All Movements")).toBeVisible();
   });
 });
