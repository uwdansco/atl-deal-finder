import { test, expect } from "@playwright/test";

async function stubSupabaseRest(page: import("@playwright/test").Page) {
  // The app uses Supabase REST queries for public pages (deals/blog/etc).
  // Stub them so E2E is stable even when network/quota is unavailable.
  await page.route(/\/rest\/v1\/.*/i, async (route) => {
    // Default: most queries are list selects => return empty list.
    // If something expects an object, the app generally catches errors and renders empty state anyway.
    const body = "[]";

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body,
      headers: {
        "access-control-allow-origin": "*",
        "content-range": "0-0/0",
        "x-supabase-api-version": "2025-01-01",
      },
    });
  });

  // Some pages may fetch edge functions (AI gateway, etc). Make them non-blocking.
  await page.route("https://ai.gateway.lovable.dev/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ choices: [{ message: { content: "{}" } }] }),
      headers: { "access-control-allow-origin": "*" },
    });
  });
}

test.beforeEach(async ({ page }) => {
  await stubSupabaseRest(page);
});

test("home loads and renders hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("deals page loads and shows empty-state (stubbed)", async ({ page }) => {
  await page.goto("/deals");
  await expect(page.getByRole("heading", { level: 1, name: "All Flight Deals from Atlanta" })).toBeVisible();
  // Should eventually resolve loading state.
  await expect(page.getByRole("heading", { level: 3, name: "No deals found" })).toBeVisible();
});

test("pricing page loads", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1, name: "Choose Your Plan" })).toBeVisible();
});

test("protected dashboard redirects to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("unknown route shows not found", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByText(/not found/i)).toBeVisible();
});

