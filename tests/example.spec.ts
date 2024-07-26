import { test as base, type BrowserContext } from "@playwright/test";
import { chromium } from "playwright";
import path from "node:path";

// @ts-ignore: stop typescript from bitching about import.meta
const __dirname = path.dirname(import.meta.filename);

const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  // biome-ignore lint: not use what this object destructuring is for
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, "../dist");
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
      page.locator("#favicon"),
    ],
  });
});
