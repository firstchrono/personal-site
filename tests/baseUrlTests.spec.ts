import { test, expect } from '@playwright/test';

const baseUrl = 'http://localhost:3000';

test('homepage has title', async ({ page }) => {
  await page.goto(baseUrl);

  await expect(page).toHaveTitle("Jon Stump: Personal Site");
});

test('portfolio has title', async ({ page }) => {
  await page.goto(baseUrl+'/portfolio');

  await expect(page).toHaveTitle("Portfolio");
});

test('posts has title', async ({ page }) => {
  await page.goto(baseUrl+'/projects');
  
  await expect(page).toHaveTitle("Blog");
});

test('resume has title', async ({ page }) => {
  await page.goto(baseUrl+'/resume');
  
  await expect(page).toHaveTitle("Resume");
});

test('contact has title', async ({ page }) => {
  await page.goto(baseUrl+'/contact');
  
  await expect(page).toHaveTitle("Contact Me");
});

test('404 page has title', async ({ page }) => {
  await page.goto(baseUrl+'/badurl');
  
  await expect(page).toHaveTitle("Not Found");
});

// create a locator
//const getStarted = page.locator('text=Portfolio');

// Expect an attribute "to be strictly equal" to the value.
//await expect(getStarted).toHaveAttribute('href', '/PortfolioPage');

// Click the get started link.
//await getStarted.click();

// Expects the URL to contain intro.
//await expect(page).toHaveURL(/PortfolioPage/);
