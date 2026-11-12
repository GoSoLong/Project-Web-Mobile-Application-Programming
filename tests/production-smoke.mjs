// Run after npm run build and while npm run preview -- --port 4173 is running.
import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const visited = [];
async function waitForMapTiles() {
  await expect
    .poll(() =>
      page.locator('.leaflet-tile').evaluateAll(tiles =>
        tiles.length > 0 && tiles.every(tile => tile.complete && tile.naturalWidth > 0 && Number(getComputedStyle(tile).opacity) === 1)
      ), { timeout: 15000 }
    )
    .toBeTruthy();
}
try {
  for (const route of [
    "overview",
    "live",
    "history",
    "sharing",
    "analytics",
    "notifications",
    "settings",
  ]) {
    const response = await page.goto(`http://127.0.0.1:4173/#/${route}`);
    // Hash navigation reuses the document and correctly returns a null response.
    if (response) expect(response.status()).toBe(200);
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute(
      "href",
      `#/${route}`,
    );
    await expect(page.locator("main h1")).toBeVisible();
    expect(await page.locator("main h1").textContent()).not.toContain(
      "Không thể",
    );
    visited.push(route);
  }
  await mkdir("docs/screenshots", { recursive: true });
  for (const route of ["overview", "sharing", "analytics"]) {
    await page.goto(`http://127.0.0.1:4173/#/${route}`);
    await expect(page.locator("main h1")).toBeVisible();
    if (route === "overview")
      await expect(page.locator(".leaflet-marker-icon")).toHaveCount(3);
    if (route === "overview") await waitForMapTiles();
    await page.screenshot({
      path: `docs/screenshots/production-${route}.png`,
      fullPage: true,
    });
  }
  await page.goto("http://127.0.0.1:4173/#/history");
  await page.locator(".trip-link").first().click();
  await expect(
    page.getByRole("button", { name: "Phát lại hành trình", exact: true }),
  ).toBeVisible();
  await waitForMapTiles();
  await page.screenshot({
    path: "docs/screenshots/production-replay.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  const result = {
    source: "production dist served by vite preview",
    visited,
    pageErrors: errors,
    status: "PASS",
    at: new Date().toISOString(),
  };
  await writeFile(
    "docs/production-smoke.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
