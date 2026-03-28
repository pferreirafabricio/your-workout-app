import { expect, type Page } from "@playwright/test";

export async function gotoHomeDashboard(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Performance Dashboard" })).toBeVisible();
}

export async function selectMovementMetric(page: Page, metricLabel: "Maximum Weight" | "Total Reps" | "Total Volume") {
  await page.getByLabel("Metric").first().selectOption({ label: metricLabel });
}

export async function selectNutritionMetric(
  page: Page,
  metricLabel: "Calories" | "Protein (g)" | "Carbs (g)" | "Fats (g)" | "Bodyweight (kg)",
) {
  await page.getByLabel("Metric").nth(1).selectOption({ label: metricLabel });
}

export async function setDashboardDateRange(page: Page, startDate: string, endDate: string) {
  await page.getByLabel("Start Date").fill(startDate);
  await page.getByLabel("End Date").fill(endDate);
}

export async function expectDashboardCardVisible(page: Page, title: "Movement Progression" | "Nutrition Trend") {
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}
