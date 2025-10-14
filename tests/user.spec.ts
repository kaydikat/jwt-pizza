import { test, expect } from "playwright-test-coverage";
import { basicInit } from "./test-utils";

test("updateUserName", async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("pizza diner");
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Register" }).click();

  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza diner");

  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator("h3")).toContainText("Edit user");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();

  await expect(page.getByRole("main")).toContainText("pizza diner");

  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator("h3")).toContainText("Edit user");
  await page.getByRole("textbox").first().fill("pizza dinerx");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();

  await expect(page.getByRole("main")).toContainText("pizza dinerx");

  await page.getByRole("link", { name: "Logout" }).click();
  await page.getByRole("link", { name: "Login" }).click();

  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Login" }).click();

  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza dinerx");
});

test("updateUser email and password", async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("pizza diner");
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Register" }).click();

  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza diner");

  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator("h3")).toContainText("Edit user");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();

  await expect(page.getByRole("main")).toContainText("pizza diner");

  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator("h3")).toContainText("Edit user");
  await page.locator('input[type="email"]').click();
  await page.locator('input[type="email"]').fill("useredited@jwt.com");
  await page.locator("#password").click();
  await page.locator("#password").fill("newpassword");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();

  await expect(page.getByRole("main")).toContainText("pizza diner");

  await page.getByRole("link", { name: "Logout" }).click();
  await page.getByRole("link", { name: "Login" }).click();

  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("useredited@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("newpassword");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("link", { name: "pd" })).toBeVisible();
  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza diner");
});

test("updateAdmin", async ({ page }) => {
  await basicInit(page);

  await page.getByRole("link", { name: "Login" }).click();
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("admin@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("link", { name: "AU" })).toBeVisible();

  await page.getByRole("link", { name: "AU" }).click();
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("textbox").first().click();
  await page.getByRole("textbox").first().fill("Admin Userx");
  await page.locator('input[type="email"]').click();
  await page.locator('input[type="email"]').fill("adminx@jwt.com");
  await page.locator("#password").click();
  await page.locator("#password").fill("adminx");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByRole("link", { name: "AU" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Admin Userx");
  await page.getByRole("link", { name: "Logout" }).click();
  await page.getByRole("link", { name: "Login" }).click();
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("adminx@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("adminx");
  await page.getByRole("button", { name: "Login" }).click();

  await page.getByRole("link", { name: "AU" }).click();
  await expect(page.getByRole("main")).toContainText("Admin Userx");
});

test("updateFranchisee", async ({ page }) => {
  await basicInit(page);

  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("f@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("franchisee");
  await page.getByRole("button", { name: "Login" }).click();

  await page.getByRole("link", { name: "FU" }).click();
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("textbox").first().click();
  await page.getByRole("textbox").first().fill("Franchisee Userx");
  await page.locator('input[type="email"]').click();
  await page.locator('input[type="email"]').fill("franchiseex@jwt.com");
  await page.locator("#password").click();
  await page.locator("#password").fill("franchiseex");
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page.getByRole("link", { name: "FU" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Franchisee Userx");
  await page.getByRole("link", { name: "Logout" }).click();
  await page.getByRole("link", { name: "Login" }).click();
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("franchiseex@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("franchiseex");
  await page.getByRole("button", { name: "Login" }).click();

  await page.getByRole("link", { name: "FU" }).click();
  await expect(page.getByRole("main")).toContainText("Franchisee Userx");
});

test("admin checks if user list has users, deletes, and filters", async ({
  page,
}) => {
  await basicInit(page);

  await page.getByRole("link", { name: "Login" }).click();
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("admin@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();

  await page.getByRole("link", { name: "Admin" }).click();

  await page.getByRole("cell", { name: "Kai Chen" }).click();

  await page.getByRole("button", { name: "Delete" }).first().click();

  await expect(page.getByRole("cell", { name: "Kai Chen" })).toHaveCount(0);

  await page.getByRole("textbox", { name: "Filter users" }).click();
  await page.getByRole("textbox", { name: "Filter users" }).fill("admin");

  await page.getByRole("button", { name: "Submit" }).nth(1).click();

  await page.getByRole("cell", { name: "Admin User" }).click();

  await page.getByRole("link", { name: "Logout" }).click();
  await page.getByRole("link", { name: "Login" }).click();
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("admin@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "Admin" }).click();

  await expect(page.getByRole("cell", { name: "Kai Chen" })).toHaveCount(0);
});
