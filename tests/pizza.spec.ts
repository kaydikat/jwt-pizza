import { Page } from '@playwright/test';
import { test, expect } from 'playwright-test-coverage';
import { User, Role } from '../src/service/pizzaService';

test('home page', async ({ page }) => {
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
  
});

async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = { 
    'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
    'admin@jwt.com': { id: '4', name: 'Admin User', email: 'admin@jwt.com', password: 'admin', roles: [{ role: Role.Admin }] },
    'f@jwt.com': { id: '5', name: 'Franchisee User', email: 'f@jwt.com', password: 'franchisee', roles: [{ role: Role.Franchisee }] }
  };

  await page.route('*/**/api/auth', async (route) => {
    const method = route.request().method();
    
    if (method === 'PUT') {
      // Login
      const loginReq = route.request().postDataJSON();
      const user = validUsers[loginReq.email];
      if (!user || user.password !== loginReq.password) {
        await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
        return;
      }
      loggedInUser = user;
      const loginRes = {
        user: loggedInUser,
        token: 'abcdef',
      };
      await route.fulfill({ json: loginRes });
    } else if (method === 'POST') {
      // Register
      const registerReq = route.request().postDataJSON();
      const newUser = {
        id: '999',
        name: registerReq.name,
        email: registerReq.email,
        roles: [{ role: Role.Diner }]
      };
      loggedInUser = newUser;
      const registerRes = {
        user: newUser,
        token: 'abcdef',
      };
      await route.fulfill({ json: registerRes });
    } else if (method === 'DELETE') {
      // Logout
      loggedInUser = undefined;
      await route.fulfill({ json: { message: 'logout successful' } });
    }
  });

  // Return the currently logged in user
  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: loggedInUser });
  });

  // A standard menu
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      {
        id: 1,
        title: 'Veggie',
        image: 'pizza1.png',
        price: 0.0038,
        description: 'A garden of delight',
      },
      {
        id: 2,
        title: 'Pepperoni',
        image: 'pizza2.png',
        price: 0.0042,
        description: 'Spicy treat',
      },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  // Handle franchise operations
  let mockFranchises = [
    {
      id: 2,
      name: 'LotaPizza',
      admins: [{ email: 'f@jwt.com' }],
      stores: [
        { id: 4, name: 'Lehi' },
        { id: 5, name: 'Springville' },
        { id: 6, name: 'American Fork' },
      ],
    },
    { id: 3, name: 'PizzaCorp', admins: [{ email: 'admin@jwt.com' }], stores: [{ id: 7, name: 'Spanish Fork' }] },
    { id: 4, name: 'topSpot', admins: [{ email: 'admin@jwt.com' }], stores: [] },
  ];

  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const method = route.request().method();
    
    if (method === 'GET') {
      const url = route.request().url();
      if (loggedInUser && loggedInUser.roles?.some(r => r.role === Role.Franchisee)) {
        // For franchisees, return their franchises directly
        const userFranchises = mockFranchises.filter(f => 
          f.admins?.some(admin => admin.email === loggedInUser?.email)
        );
        await route.fulfill({ json: userFranchises });
      } else {
        // For admin or general requests, return all franchises
        await route.fulfill({ json: { franchises: mockFranchises } });
      }
    } else if (method === 'POST') {
      // Create franchise
      const franchiseReq = route.request().postDataJSON();
      const newFranchise = {
        id: mockFranchises.length + 1,
        name: franchiseReq.name,
        admins: [{ email: franchiseReq.admins?.[0]?.email || 'a@jwt.com' }],
        stores: []
      };
      mockFranchises.push(newFranchise);
      await route.fulfill({ json: newFranchise });
    }
  });

  // Handle user-specific franchise data for dashboard
  await page.route('*/**/api/franchise/user', async (route) => {
    if (loggedInUser && loggedInUser.roles?.some(r => r.role === Role.Franchisee)) {
      const userFranchises = mockFranchises.filter(f => 
        f.admins?.some(admin => admin.email === loggedInUser?.email)
      );
      await route.fulfill({ json: userFranchises });
    } else {
      await route.fulfill({ json: [] });
    }
  });

  // Handle specific franchise operations
  await page.route(/\/api\/franchise\/(\d+)$/, async (route) => {
    const method = route.request().method();
    const franchiseId = parseInt(route.request().url().match(/\/api\/franchise\/(\d+)$/)?.[1] || '0');
    
    if (method === 'DELETE') {
      // Close franchise
      mockFranchises = mockFranchises.filter(f => f.id !== franchiseId);
      await route.fulfill({ json: { message: 'franchise deleted' } });
    } else if (method === 'GET') {
      // Get specific franchise details
      const franchise = mockFranchises.find(f => f.id === franchiseId);
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
    const franchiseId = parseInt(route.request().url().match(/\/api\/franchise\/(\d+)\/store$/)?.[1] || '0');
    
    if (method === 'POST') {
      // Create store
      const storeReq = route.request().postDataJSON();
      const franchise = mockFranchises.find(f => f.id === franchiseId);
      if (franchise) {
        const newStore = {
          id: Date.now(),
          name: storeReq.name,
          totalRevenue: 0
        };
        franchise.stores.push(newStore);
        await route.fulfill({ json: newStore });
      }
    }
  });

  // Handle specific store operations
  await page.route(/\/api\/franchise\/(\d+)\/store\/(\d+)$/, async (route) => {
    const method = route.request().method();
    const franchiseId = parseInt(route.request().url().match(/\/api\/franchise\/(\d+)\/store\/(\d+)$/)?.[1] || '0');
    const storeId = parseInt(route.request().url().match(/\/api\/franchise\/(\d+)\/store\/(\d+)$/)?.[2] || '0');
    
    if (method === 'DELETE') {
      // Close store
      const franchise = mockFranchises.find(f => f.id === franchiseId);
      if (franchise) {
        franchise.stores = franchise.stores.filter(s => s.id !== storeId);
        await route.fulfill({ json: { message: 'store deleted' } });
      }
    }
  });

  // Order a pizza.
  await page.route('*/**/api/order', async (route) => {
    const method = route.request().method();
    
    if (method === 'POST') {
      const orderReq = route.request().postDataJSON();
      const orderRes = {
        order: { ...orderReq, id: 23 },
        jwt: 'eyJpYXQ',
      };
      await route.fulfill({ json: orderRes });
    } else if (method === 'GET') {
      // Return order history for diner dashboard
      const orderHistory = {
        dinerId: loggedInUser?.id || '3',
        orders: [
          { 
            id: 1, 
            franchiseId: 2, 
            storeId: 4, 
            date: '2024-01-01T12:00:00.000Z', 
            items: [{ menuId: 1, description: 'Veggie', price: 0.0038 }] 
          }
        ],
        page: 1
      };
      await route.fulfill({ json: orderHistory });
    }
  });

  await page.goto('/');
}

test('login', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
});

test('purchase with login', async ({ page }) => {
  await basicInit(page);

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Verify
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.getByRole('heading', { name: 'JWT Pizza - valid' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();
});

test('register', async ({ page }) => {
  await basicInit(page);
  
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('jt');
  await page.getByRole('textbox', { name: 'Full name' }).press('Tab');
  await page.getByRole('textbox', { name: 'Email address' }).fill('jt@jt');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('jt');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByText('The web\'s best pizza', { exact: true }).click();
});

test('logout', async ({ page }) => {
  await basicInit(page);
  
  // Login first
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'KC' })).toBeVisible();
  
  // Logout
  await page.getByRole('link', { name: 'Logout' }).click();
});

test('admin login and dashboard', async ({ page }) => {
  await basicInit(page);
  
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  
  await expect(page.getByRole('link', { name: 'AU' })).toBeVisible();
  
  await page.getByRole('link', { name: 'Admin' }).click();
  
  await expect(page.getByRole('heading', { name: 'Mama Ricci\'s kitchen' })).toBeVisible();
});

test('admin closes franchise', async ({ page }) => {
  await basicInit(page);
  
  // Login as admin
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  
  // Go to admin dashboard
  await page.getByRole('link', { name: 'Admin' }).click();
  
  // Close a franchise
  await page.getByRole('row', { name: /LotaPizza.*Close/ }).getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  
  await expect(page.getByRole('heading', { name: 'Mama Ricci\'s kitchen' })).toBeVisible();
});

test('admin creates and filters franchise', async ({ page }) => {
  await basicInit(page);
  
  // Login as admin
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  
  await page.getByRole('link', { name: 'Admin' }).click();
  
  // Create franchise
  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await page.getByRole('textbox', { name: 'franchise name' }).fill('Franchise6');
  await page.getByRole('textbox', { name: 'franchisee admin email' }).fill('franchisee@jwt.com');
  await page.getByRole('button', { name: 'Create' }).click();

  // Filter franchise

  await page.getByRole('textbox', { name: 'Filter franchises' }).click();
  await page.getByRole('textbox', { name: 'Filter franchises' }).fill('franchise');
  await page.getByRole('button', { name: 'Submit' }).click();
});

test('franchisee login and dashboard', async ({ page }) => {
  await basicInit(page);
  
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
  await page.getByRole('button', { name: 'Login' }).click();
  
  await expect(page.getByRole('link', { name: 'FU' })).toBeVisible();
  
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  
});

test('about page', async ({ page }) => {
  await basicInit(page);
await page.getByRole('link', { name: 'About' }).click();
await page.getByText('The secret sauce').click();

});

test('history page', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'History' }).click();
  await page.getByText('Mama Rucci, my my').click();
});

test('diner dashboard', async ({ page }) => {
  await basicInit(page);
  
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'KC' }).click();
  await expect(page).toHaveURL(/.*diner-dashboard.*/);
});

test('404 not found page', async ({ page }) => {
  await basicInit(page);
  
  await page.goto('/nonexistent-page');

  await page.getByText('Oops').click();
});
