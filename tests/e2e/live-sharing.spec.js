import { test, expect } from "@playwright/test";
async function user(page, id) {
  await page.goto("/#/settings");
  await page.getByLabel("Hồ sơ demo").selectOption(id);
}
test("live location has no route or destination; owner explicitly shares and removes a journey", async ({
  page,
}) => {
  await page.goto("/#/live");
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(3);
  await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(0);
  await expect(page.locator(".journey-overlay")).toContainText(
    "Vị trí trực tiếp",
  );
  await expect(page.locator(".route-caption")).toHaveCount(0);
  await expect(page.locator(".journey-progress")).toHaveCount(0);
  await expect(page.locator(".map-legend")).toHaveCount(0);
  await user(page, "linh");
  await page.goto("/#/sharing");
  await page
    .getByLabel("Hành trình trực tiếp với Minh Trường", { exact: true })
    .selectOption("live-linh");
  await page.reload();
  await expect(
    page.getByLabel("Hành trình trực tiếp với Minh Trường", { exact: true }),
  ).toHaveValue("live-linh");
  await user(page, "truong");
  await page.goto("/#/live");
  await expect(page.locator(".route-caption")).toBeVisible();
  await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(4);
  await page.getByLabel("Vị trí của Hoàng Nam", { exact: true }).click();
  await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(0);
  await expect(page.locator(".route-caption")).toHaveCount(0);
  await page.getByLabel("Vị trí của Ngọc Linh", { exact: true }).click();
  await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(4);
  await user(page, "linh");
  await page.goto("/#/sharing");
  await page
    .getByLabel("Hành trình trực tiếp với Minh Trường", { exact: true })
    .selectOption("");
  await user(page, "truong");
  for (const route of ["live", "overview"]) {
    await page.goto(`/#/${route}`);
    await expect(page.locator(".leaflet-marker-icon")).toHaveCount(3);
    await expect(page.locator(".leaflet-overlay-pane path")).toHaveCount(0);
    await expect(page.locator(".route-caption")).toHaveCount(0);
  }
});
