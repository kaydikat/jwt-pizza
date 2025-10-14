import { test, expect } from "playwright-test-coverage";
import { basicInit } from "./test-utils";

test("home page", async ({ page }) => {
  await page.goto("/");

  expect(await page.title()).toBe("JWT Pizza");
});

test("register", async ({ page }) => {
  await basicInit(page);

  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("jt");
  await page.getByRole("textbox", { name: "Full name" }).press("Tab");
  await page.getByRole("textbox", { name: "Email address" }).fill("jt@jt");
  await page.getByRole("textbox", { name: "Email address" }).press("Tab");
  await page.getByRole("textbox", { name: "Password" }).fill("jt");
  await page.getByRole("button", { name: "Register" }).click();
  await page.getByText("The web's best pizza", { exact: true }).click();
});

test("logout", async ({ page }) => {
  await basicInit(page);

  // Login first
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("d@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("link", { name: "KC" })).toBeVisible();

  // Logout
  await page.getByRole("link", { name: "Logout" }).click();
});

test("admin login and dashboard", async ({ page }) => {
  await basicInit(page);

  await page.getByRole("link", { name: "Login" }).click();
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("admin@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("link", { name: "AU" })).toBeVisible();

  await page.getByRole("link", { name: "Admin" }).click();

  await expect(
    page.getByRole("heading", { name: "Mama Ricci's kitchen" })
  ).toBeVisible();
});

test("admin closes franchise", async ({ page }) => {
  await basicInit(page);

  // Login as admin
  await page.getByRole("link", { name: "Login" }).click();
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("admin@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();

  // Go to admin dashboard
  await page.getByRole("link", { name: "Admin" }).click();

  // Close a franchise
  await page
    .getByRole("row", { name: /LotaPizza.*Close/ })
    .getByRole("button", { name: "Close" })
    .click();
  await page.getByRole("button", { name: "Close" }).click();

  await expect(
    page.getByRole("heading", { name: "Mama Ricci's kitchen" })
  ).toBeVisible();
});

test("admin creates and filters franchise", async ({ page }) => {
  await basicInit(page);

  // Login as admin
  await page.getByRole("link", { name: "Login" }).click();
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("admin@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();

  await page.getByRole("link", { name: "Admin" }).click();

  // Create franchise
  await page.getByRole("button", { name: "Add Franchise" }).click();
  await page
    .getByRole("textbox", { name: "franchise name" })
    .fill("Franchise6");
  await page
    .getByRole("textbox", { name: "franchisee admin email" })
    .fill("franchisee@jwt.com");
  await page.getByRole("button", { name: "Create" }).click();

  // Filter franchise

  await page.getByRole("textbox", { name: "Filter franchises" }).click();
  await page
    .getByRole("textbox", { name: "Filter franchises" })
    .fill("franchise");
  await page.getByRole("button", { name: "Submit" }).click();
});

test("franchisee login and dashboard", async ({ page }) => {
  await basicInit(page);

  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("f@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("franchisee");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("link", { name: "FU" })).toBeVisible();

  await page
    .getByLabel("Global")
    .getByRole("link", { name: "Franchise" })
    .click();
});

test("about page", async ({ page }) => {
  await basicInit(page);
  await page.getByRole("link", { name: "About" }).click();
  await page.getByText("The secret sauce").click();
});

test("history page", async ({ page }) => {
  await basicInit(page);
  await page.getByRole("link", { name: "History" }).click();
  await page.getByText("Mama Rucci, my my").click();
});

test("diner dashboard", async ({ page }) => {
  await basicInit(page);

  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("d@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "KC" }).click();
  await expect(page).toHaveURL(/.*diner-dashboard.*/);
});

test("404 not found page", async ({ page }) => {
  await basicInit(page);

  await page.goto("/nonexistent-page");

  await page.getByText("Oops").click();
});
