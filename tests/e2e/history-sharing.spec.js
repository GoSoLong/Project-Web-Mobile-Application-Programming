import { test, expect } from "@playwright/test";
const key = "journeylink.demo.v1";
const state = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
async function user(page, id) {
  await page.goto("/#/settings");
  await page.getByLabel("Hồ sơ demo").selectOption(id);
}
async function send(page) {
  await page.getByLabel("Người nhận lịch sử").selectOption("nam");
  await page
    .getByRole("button", { name: "Gửi lời mời chia sẻ", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Đã gửi lời mời");
  return (await state(page)).grants.find((g) => g.kind === "history");
}
async function accept(page, id) {
  await user(page, "nam");
  await page.goto("/#/sharing");
  await page
    .locator(`[data-share-id="${id}"]`)
    .getByRole("button", { name: "Chấp nhận lịch sử" })
    .click();
}
test("single journey invitation, acceptance, replay and owner revocation", async ({
  page,
}) => {
  await page.goto("/#/history");
  const trips = (await state(page)).journeys.filter(
    (j) => j.ownerId === "truong" && j.status === "completed",
  );
  await page.goto(`/#/history/${trips[0].id}`);
  await page
    .getByRole("button", { name: "Chia sẻ hành trình", exact: true })
    .click();
  const grant = await send(page);
  expect(grant.journeyIds).toEqual([trips[0].id]);
  await user(page, "nam");
  await page.goto(`/#/history/${trips[0].id}`);
  await expect(
    page.getByRole("heading", { name: "Hành trình không khả dụng" }),
  ).toBeVisible();
  await accept(page, grant.id);
  await page.goto("/#/history");
  await page.getByLabel("Phạm vi lịch sử").selectOption("shared");
  await page.getByLabel("Người di chuyển").selectOption("truong");
  await expect(page.locator(".trip-card")).toHaveCount(1);
  await page.goto(`/#/history/${trips[0].id}`);
  await expect(
    page.getByRole("button", { name: "Phát lại hành trình", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Chia sẻ hành trình", exact: true }),
  ).toHaveCount(0);
  await page.goto(`/#/history/${trips[1].id}`);
  await expect(
    page.getByRole("heading", { name: "Hành trình không khả dụng" }),
  ).toBeVisible();
  await user(page, "truong");
  await page.goto("/#/sharing");
  await page
    .locator(`[data-share-id="${grant.id}"]`)
    .getByRole("button", { name: "Thu hồi chia sẻ" })
    .click();
  await user(page, "nam");
  await page.goto(`/#/history/${trips[0].id}`);
  await expect(
    page.getByRole("heading", { name: "Hành trình không khả dụng" }),
  ).toBeVisible();
});
test("batch history sharing persists and fits a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/history");
  const trips = (await state(page)).journeys
    .filter((j) => j.ownerId === "truong" && j.status === "completed")
    .slice(0, 2);
  for (const trip of trips)
    await page
      .getByLabel(`Chọn hành trình ${trip.id}`, { exact: true })
      .check();
  await page
    .getByRole("button", { name: "Chia sẻ 2 hành trình", exact: true })
    .click();
  await expect(page.locator(".shared-trip-preview p")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshots/history-sharing-mobile.png",
    fullPage: true,
  });
  const grant = await send(page);
  await page.reload();
  expect(
    (await state(page)).grants.find((g) => g.id === grant.id).journeyIds.sort(),
  ).toEqual(trips.map((j) => j.id).sort());
  await accept(page, grant.id);
  await page.goto("/#/history");
  await page.getByLabel("Phạm vi lịch sử").selectOption("shared");
  await page.getByLabel("Người di chuyển").selectOption("truong");
  await expect(page.locator(".trip-card")).toHaveCount(2);
});
test("all history share expires and removes access on an open detail page", async ({
  page,
}) => {
  await page.goto("/#/history");
  const trips = (await state(page)).journeys.filter(
    (j) => j.ownerId === "truong" && j.status === "completed",
  );
  await page
    .getByRole("button", { name: "Chia sẻ lịch sử", exact: true })
    .click();
  const grant = await send(page);
  expect(grant.journeyIds).toBeUndefined();
  await accept(page, grant.id);
  await page.goto("/#/history");
  await page.getByLabel("Phạm vi lịch sử").selectOption("shared");
  await page.getByLabel("Người di chuyển").selectOption("truong");
  await expect(page.locator(".trip-card")).toHaveCount(trips.length);
  await page.goto(`/#/history/${trips[0].id}`);
  await expect(page.locator(".replay-panel")).toBeVisible();
  await page.evaluate(
    ({ key, id }) => {
      const s = JSON.parse(localStorage.getItem(key));
      s.grants.find((g) => g.id === id).expiresAt = Date.now() + 2000;
      localStorage.setItem(key, JSON.stringify(s));
    },
    { key, id: grant.id },
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Hành trình không khả dụng" }),
  ).toBeVisible({ timeout: 6000 });
  await expect(page.locator(".replay-panel")).toHaveCount(0);
});
