import { test as base, type BrowserContext } from "@playwright/test";
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

// @ts-ignore: stop typescript from bitching about import.meta
const __dirname = path.dirname(import.meta.filename);

const data = fs.readFileSync(path.join(__dirname, "../package.json"), "utf8");
const packageJson = JSON.parse(data);
const outDir = `../.output/samay-${packageJson.version}-chrome`;

const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  // biome-ignore lint: not use what this object destructuring is for
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, outDir);
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        "--headless=new",
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent("backgroundpage");
    }
    const exntesionId = background.url().split("/")[2];
    await use(exntesionId);
  },
});

const expect = test.expect;

test("Extension in New Tab page", async ({ page }) => {
  await page.goto("https://playwright.dev/");
  await page.waitForTimeout(3000);
  await page.goto("chrome://newtab");
  await expect(page).toHaveTitle("New Tab");
  await expect(page).toHaveScreenshot({
    mask: [
      page.locator("section > div:last-child > div:first-child svg"),
      page.locator("#overview-header"),
      page.locator("#favicon"),
    ],
  });
});

test("Focus mode", async ({ page }) => {
  await page.goto("chrome://newtab");
  const fm = page.locator("#focusmode");
  await expect(fm).toHaveScreenshot("focusmode.png");

  await fm.locator("input").fill("www.youtube.com");
  await page.keyboard.press("Enter");
  await expect(fm).toHaveScreenshot("focusmode-blocklist-input-focused.png");

  await fm.locator("li button").click();
  await expect(fm).toHaveScreenshot("focusmode.png");

  await fm.locator("input").fill("www.youtube.com");
  await fm.getByText("Add").click();
  await expect(fm).toHaveScreenshot("focusmode-blocklist-input-blurred.png");

  await fm.getByRole("switch").click();
  await page.goto("https://www.youtube.com");
  await expect(page).toHaveScreenshot("redirect-page.png");
});

test("Drawer", async ({ page }) => {
  await page.goto("https://example.com/");
  await page.waitForTimeout(1000);
  await page.goto("chrome://newtab");
  page.getByRole("list").getByText("example.com").click();
  await expect(page).toHaveScreenshot("drawer.png", {
    mask: [page.locator("div[role='dialog'] svg")],
  });
});
