import { Page } from "@playwright/test";
import { expect } from "playwright-test-coverage";
import { User, Role } from "../src/service/pizzaService";

export async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = {
    "d@jwt.com": {
      id: "3",
      name: "Kai Chen",
      email: "d@jwt.com",
      password: "a",
      roles: [{ role: Role.Diner }],
    },
    "admin@jwt.com": {
      id: "4",
      name: "Admin User",
      email: "admin@jwt.com",
      password: "admin",
      roles: [{ role: Role.Admin }],
    },
    "f@jwt.com": {
      id: "5",
      name: "Franchisee User",
      email: "f@jwt.com",
      password: "franchisee",
      roles: [{ role: Role.Franchisee }],
    },
  };

  await page.route("*/**/api/auth", async (route) => {
    const method = route.request().method();

    if (method === "PUT") {
      // Login
      const loginReq = route.request().postDataJSON();
      const user = validUsers[loginReq.email];
      if (!user || user.password !== loginReq.password) {
        await route.fulfill({ status: 401, json: { error: "Unauthorized" } });
        return;
      }
      loggedInUser = user;
      const loginRes = {
        user: { ...loggedInUser, password: undefined },
        token: "abcdef",
      };
      await route.fulfill({ json: loginRes });
    } else if (method === "POST") {
      // Register
      const registerReq = route.request().postDataJSON();
      const newUser = {
        id: "999",
        name: registerReq.name,
        email: registerReq.email,
        password: registerReq.password,
        roles: [{ role: Role.Diner }],
      };
      loggedInUser = newUser;
      validUsers[newUser.email] = newUser;
      const registerRes = {
        user: { ...newUser, password: undefined },
        token: "abcdef",
      };
      await route.fulfill({ json: registerRes });
    } else if (method === "DELETE") {
      // Logout
      loggedInUser = undefined;
      await route.fulfill({ json: { message: "logout successful" } });
    }
  });

  // Return the currently logged in user
  await page.route("*/**/api/user/me", async (route) => {
    expect(route.request().method()).toBe("GET");
    if (loggedInUser) {
      await route.fulfill({ json: { ...loggedInUser, password: undefined } });
    } else {
      await route.fulfill({ status: 401, json: { error: "Unauthorized" } });
    }
  });

  // Handle user updates
  await page.route(/\/api\/user\/(\d+)$/, async (route) => {
    const method = route.request().method();

    if (method === "PUT") {
      const updatedUserData = route.request().postDataJSON();

      // Update the logged in user with the new data
      if (loggedInUser) {
        const oldEmail = loggedInUser.email;
        const newName = updatedUserData.name || loggedInUser.name;
        const newEmail = updatedUserData.email || loggedInUser.email;
        const newPassword = updatedUserData.password || loggedInUser.password;

        loggedInUser = {
          ...loggedInUser,
          name: newName,
          email: newEmail,
          password: newPassword,
        };

        // Update in validUsers
        if (newEmail !== oldEmail) {
          if (oldEmail && validUsers[oldEmail]) {
            delete validUsers[oldEmail];
          }
          if (newEmail) {
            validUsers[newEmail] = { ...loggedInUser };
          }
        } else {
          if (newEmail && validUsers[newEmail]) {
            validUsers[newEmail] = { ...loggedInUser };
          }
        }
      }

      const updateRes = {
        user: { ...loggedInUser, password: undefined },
        token: "abcdef",
      };
      await route.fulfill({ json: updateRes });
    } else if (method === "DELETE") {
      const userId = route
        .request()
        .url()
        .match(/\/api\/user\/(\d+)$/)?.[1];
      // Find and remove the user from validUsers
      const userToDelete = Object.values(validUsers).find(
        (user) => user.id === userId
      );
      if (userToDelete && userToDelete.email) {
        // Remove user from validUsers by email
        if (validUsers[userToDelete.email]) {
          delete validUsers[userToDelete.email];
        }
        // Clear logged-in user if they are deleted
        if (loggedInUser?.id === userId) {
          loggedInUser = undefined;
        }
        await route.fulfill({ json: { message: "user deleted" } });
      } else {
        await route.fulfill({ status: 404, json: { error: "User not found" } });
      }
    } else {
      await route.fulfill({
        status: 405,
        json: { error: "Method Not Allowed" },
      });
    }
  });

  // A standard menu
  await page.route("*/**/api/order/menu", async (route) => {
    const menuRes = [
      {
        id: 1,
        title: "Veggie",
        image: "pizza1.png",
        price: 0.0038,
        description: "A garden of delight",
      },
      {
        id: 2,
        title: "Pepperoni",
        image: "pizza2.png",
        price: 0.0042,
        description: "Spicy treat",
      },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: menuRes });
  });

  // Handle franchise operations
  let mockFranchises = [
    {
      id: 2,
      name: "LotaPizza",
      admins: [{ email: "f@jwt.com" }],
      stores: [
        { id: 4, name: "Lehi" },
        { id: 5, name: "Springville" },
        { id: 6, name: "American Fork" },
      ],
    },
    {
      id: 3,
      name: "PizzaCorp",
      admins: [{ email: "admin@jwt.com" }],
      stores: [{ id: 7, name: "Spanish Fork" }],
    },
    {
      id: 4,
      name: "topSpot",
      admins: [{ email: "admin@jwt.com" }],
      stores: [],
    },
  ];

  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      const url = route.request().url();
      if (
        loggedInUser &&
        loggedInUser.roles?.some((r) => r.role === Role.Franchisee)
      ) {
        // For franchisees, return their franchises directly
        const userFranchises = mockFranchises.filter((f) =>
          f.admins?.some((admin) => admin.email === loggedInUser?.email)
        );
        await route.fulfill({ json: userFranchises });
      } else {
        // For admin or general requests, return all franchises
        await route.fulfill({ json: { franchises: mockFranchises } });
      }
    } else if (method === "POST") {
      // Create franchise
      const franchiseReq = route.request().postDataJSON();
      const newFranchise = {
        id: mockFranchises.length + 1,
        name: franchiseReq.name,
        admins: [{ email: franchiseReq.admins?.[0]?.email || "a@jwt.com" }],
        stores: [],
      };
      mockFranchises.push(newFranchise);
      await route.fulfill({ json: newFranchise });
    }
  });

  // Handle user-specific franchise data for dashboard
  await page.route("*/**/api/franchise/user", async (route) => {
    if (
      loggedInUser &&
      loggedInUser.roles?.some((r) => r.role === Role.Franchisee)
    ) {
      const userFranchises = mockFranchises.filter((f) =>
        f.admins?.some((admin) => admin.email === loggedInUser?.email)
      );
      await route.fulfill({ json: userFranchises });
    } else {
      await route.fulfill({ json: [] });
    }
  });

  // Handle specific franchise operations
  await page.route(/\/api\/franchise\/(\d+)$/, async (route) => {
    const method = route.request().method();
    const franchiseId = parseInt(
      route
        .request()
        .url()
        .match(/\/api\/franchise\/(\d+)$/)?.[1] || "0"
    );

    if (method === "DELETE") {
      // Close franchise
      mockFranchises = mockFranchises.filter((f) => f.id !== franchiseId);
      await route.fulfill({ json: { message: "franchise deleted" } });
    } else if (method === "GET") {
      // Get specific franchise details
      const franchise = mockFranchises.find((f) => f.id === franchiseId);
      if (franchise) {
        await route.fulfill({ json: franchise });
      } else {
        await route.fulfill({ status: 404 });
      }
    }
  });

  // Handle store operations
  await page.route(/\/api\/franchise\/(\d+)\/store$/, async (route) => {
    const method = route.request().method();
    const franchiseId = parseInt(
      route
        .request()
        .url()
        .match(/\/api\/franchise\/(\d+)\/store$/)?.[1] || "0"
    );

    if (method === "POST") {
      // Create store
      const storeReq = route.request().postDataJSON();
      const franchise = mockFranchises.find((f) => f.id === franchiseId);
      if (franchise) {
        const newStore = {
          id: Date.now(),
          name: storeReq.name,
          totalRevenue: 0,
        };
        franchise.stores.push(newStore);
        await route.fulfill({ json: newStore });
      }
    }
  });

  // Handle specific store operations
  await page.route(/\/api\/franchise\/(\d+)\/store\/(\d+)$/, async (route) => {
    const method = route.request().method();
    const franchiseId = parseInt(
      route
        .request()
        .url()
        .match(/\/api\/franchise\/(\d+)\/store\/(\d+)$/)?.[1] || "0"
    );
    const storeId = parseInt(
      route
        .request()
        .url()
        .match(/\/api\/franchise\/(\d+)\/store\/(\d+)$/)?.[2] || "0"
    );

    if (method === "DELETE") {
      // Close store
      const franchise = mockFranchises.find((f) => f.id === franchiseId);
      if (franchise) {
        franchise.stores = franchise.stores.filter((s) => s.id !== storeId);
        await route.fulfill({ json: { message: "store deleted" } });
      }
    }
  });

  // Order a pizza.
  await page.route("*/**/api/order", async (route) => {
    const method = route.request().method();

    if (method === "POST") {
      const orderReq = route.request().postDataJSON();
      const orderRes = {
        order: { ...orderReq, id: 23 },
        jwt: "eyJpYXQ",
      };
      await route.fulfill({ json: orderRes });
    } else if (method === "GET") {
      // Return order history for diner dashboard
      const orderHistory = {
        dinerId: loggedInUser?.id || "3",
        orders: [
          {
            id: 1,
            franchiseId: 2,
            storeId: 4,
            date: "2024-01-01T12:00:00.000Z",
            items: [{ menuId: 1, description: "Veggie", price: 0.0038 }],
          },
        ],
        page: 1,
      };
      await route.fulfill({ json: orderHistory });
    }
  });

  // add users to user list
  await page.route(/\/api\/user(\?.*)?$/, async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      // Extract query parameters
      const url = new URL(route.request().url());
      const page = parseInt(url.searchParams.get("page") || "0");
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const name = url.searchParams.get("name") || "*";

      // Get all users from validUsers
      let users = Object.values(validUsers);

      // Filter users by name if provided (supporting wildcard *)
      if (name !== "*") {
        const regex = new RegExp(name.replace(/\*/g, ".*"), "i");
        users = users.filter((user) => user.name && regex.test(user.name));
      }

      // Apply pagination
      const start = page * limit;
      const end = start + limit;
      const paginatedUsers = users.slice(start, end);

      // Prepare response
      const response = {
        users: paginatedUsers.map((user) => ({
          ...user,
          password: undefined,
        })),
        more: end < users.length,
      };

      await route.fulfill({ json: response });
    } else {
      await route.fulfill({
        status: 405,
        json: { error: "Method Not Allowed" },
      });
    }
  });

  await page.goto("/");
}
