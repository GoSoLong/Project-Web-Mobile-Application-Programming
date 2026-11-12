import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { aggregate } from "../../src/domain.js";
const storageKey = "journeylink.demo.v1";
test("old saved sample routes upgrade to streets without resetting profile or grants", async ({
  page,
}) => {
  await page.goto("/#/overview");
  await expect(page.locator("main")).toBeVisible();
  await page.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key));
    s.users[0].name = "Preserved profile";
    s.grants[0].status = "revoked";
    s.notifications[0].read = true;
    for (const j of s.journeys) {
      delete j.geometryVersion;
      delete j.routeId;
      j.points = [j.points[0], j.points.at(-1)];
    }
    localStorage.setItem(key, JSON.stringify(s));
  }, storageKey);
  await page.reload();
  await expect(page.locator("main")).toBeVisible();
  const upgraded = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    storageKey,
  );
  expect(upgraded.users[0].name).toBe("Preserved profile");
  expect(upgraded.grants[0].status).toBe("revoked");
  expect(upgraded.notifications[0].read).toBe(true);
  expect(
    upgraded.journeys.every(
      (j) => j.geometryVersion === 2 && j.points.length > 100,
    ),
  ).toBe(true);
  const id = upgraded.journeys.find(
    (j) => j.status === "completed" && j.ownerId === "truong",
  ).id;
  await page.goto(`/#/history/${id}`);
  await expect(
    page.getByRole("button", { name: "Phát lại hành trình", exact: true }),
  ).toBeVisible();
});
async function open(page, route = "overview") {
  await page.goto(`/#/${route}`);
  await expect(page.locator("main")).toBeVisible();
}
async function switchUser(page, id) {
  await page.goto("/#/settings");
  await page.getByLabel("Hồ sơ demo").selectOption(id);
}
async function state(page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    storageKey,
  );
}
test("dashboard, real Leaflet map, marker selection and live controls", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect(
    page.getByRole("heading", { name: /Chào Trường/ }),
  ).toBeVisible();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(3);
  await page.getByLabel("Vị trí của Hoàng Nam", { exact: true }).click();
  await expect(page.locator(".journey-overlay")).toContainText("Hoàng Nam");
  await page
    .getByRole("button", { name: "Tạm dừng mô phỏng", exact: true })
    .click();
  const transform = await page
    .locator(".leaflet-marker-icon")
    .first()
    .getAttribute("style");
  await page.waitForTimeout(1200);
  expect(
    await page.locator(".leaflet-marker-icon").first().getAttribute("style"),
  ).toBe(transform);
  await page
    .getByRole("button", { name: "Tiếp tục mô phỏng", exact: true })
    .click();
  await page
    .getByLabel("Vòng kết nối", { exact: true })
    .selectOption("friends");
  await expect(page.locator(".person-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Hiển thị các vị trí" }).click();
  await page.getByRole("button", { name: "Về vị trí được chọn" }).click();
  expect(errors).toEqual([]);
});
test("navigation, unknown route, refresh and all pages without runtime errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  for (const [route, title] of [
    ["live", "Cùng nhau trên bản đồ"],
    ["history", "Mỗi chuyến đi, một câu chuyện"],
    ["sharing", "Gần nhau, theo cách bạn chọn"],
    ["analytics", "Hiểu hơn những hành trình"],
    ["notifications", "Những cập nhật bạn quan tâm"],
    ["settings", "Không gian riêng của bạn"],
  ]) {
    await page.locator(`nav a[href="#/${route}"]`).click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
  await page.goto("/#/missing");
  await expect(
    page.getByRole("heading", { name: "Trang không tồn tại" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("search, owner/date filters, empty state and invalid date range", async ({
  page,
}) => {
  await open(page, "history");
  const count = await page.locator(".trip-card").count();
  expect(count).toBeGreaterThan(5);
  await page.getByLabel("Tìm hành trình").fill("khong ton tai xyz");
  await expect(
    page.getByRole("heading", { name: "Không tìm thấy hành trình" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await expect(page.locator(".trip-card")).toHaveCount(count);
  await page.getByLabel("Người di chuyển").selectOption("truong");
  expect(await page.locator(".trip-card").count()).toBeLessThan(count);
  await page.getByLabel("Từ ngày").fill("2026-12-30");
  await page.getByLabel("Đến ngày").fill("2026-01-01");
  await expect(page.getByRole("alert")).toContainText("Ngày kết thúc");
});
test("replay progresses, pauses, changes speed, seeks, finishes and exports JSON", async ({
  page,
}) => {
  await open(page, "history");
  await page.locator(".trip-link").first().click();
  const time = page.getByTestId("replay-time");
  const first = await time.textContent();
  await page.getByLabel("Tốc độ phát lại").selectOption("60");
  await page
    .getByRole("button", { name: "Phát lại hành trình", exact: true })
    .click();
  await expect(time).not.toHaveText(first);
  await page
    .getByRole("button", { name: "Tạm dừng phát lại", exact: true })
    .click();
  const paused = await time.textContent();
  await page.waitForTimeout(600);
  await expect(time).toHaveText(paused);
  await page.getByRole("button", { name: "Về đầu hành trình" }).click();
  await expect(time).toHaveText(first);
  const range = page.getByLabel("Tiến trình phát lại");
  await range.focus();
  await range.press("End");
  expect(await range.inputValue()).toBe(await range.getAttribute("max"));
  await range.press("ArrowLeft");
  await page
    .getByRole("button", { name: "Phát lại hành trình", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Phát lại hành trình", exact: true }),
  ).toBeVisible();
  await expect(range).toHaveValue(await range.getAttribute("max"));
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất dữ liệu mẫu" }).click();
  expect((await download).suggestedFilename()).toMatch(/journeylink-.*\.json/);
});
test("outgoing permission persists and gates recipient history including direct URLs", async ({
  page,
}) => {
  await open(page, "sharing");
  const s = await state(page),
    own = s.journeys.find(
      (j) => j.ownerId === "truong" && j.status === "completed",
    );
  const row = page
    .locator(".grant")
    .filter({
      has: page.locator(".grant-person strong", { hasText: "Ngọc Linh" }),
    })
    .first();
  await row.getByLabel("Lịch sử", { exact: true }).uncheck();
  await page.reload();
  await expect(
    page
      .locator(".grant")
      .filter({
        has: page.locator(".grant-person strong", { hasText: "Ngọc Linh" }),
      })
      .first()
      .getByLabel("Lịch sử", { exact: true }),
  ).not.toBeChecked();
  await switchUser(page, "linh");
  await page.goto(`/#/history/${own.id}`);
  await expect(
    page.getByRole("heading", {
      name: "Không có quyền xem hoặc hành trình không tồn tại",
    }),
  ).toBeVisible();
  await page.goto("/#/history");
  await expect(
    page.locator(".trip-card").filter({ hasText: "Minh Trường" }),
  ).toHaveCount(0);
});
test("pause sharing hides live positions from other profiles", async ({
  page,
}) => {
  await open(page);
  await switchUser(page, "linh");
  await page
    .getByRole("switch", { name: "Tạm dừng chia sẻ trực tiếp" })
    .check();
  await switchUser(page, "truong");
  await page.goto("/#/live");
  await expect(page.locator(".person-card")).toHaveCount(2);
  await expect(
    page.locator(".person-card").filter({ hasText: "Ngọc Linh" }),
  ).toHaveCount(0);
});
test("revoke, create invitation, accept as recipient and access history", async ({
  page,
}) => {
  await open(page, "sharing");
  const s = await state(page),
    own = s.journeys.find(
      (j) => j.ownerId === "truong" && j.status === "completed",
    );
  await page
    .locator(".grant")
    .filter({ hasText: "Hoàng Nam" })
    .first()
    .getByRole("button", { name: "Thu hồi" })
    .click();
  await page.getByRole("button", { name: "Mời người theo dõi" }).click();
  await page.getByLabel("Người nhận").selectOption("nam");
  await page.getByLabel("Lịch sử & phát lại", { exact: true }).check();
  await page.getByRole("button", { name: "Tạo lời mời demo" }).click();
  await expect(page.getByRole("status")).toContainText("Đã tạo lời mời");
  await switchUser(page, "nam");
  await page.goto(`/#/history/${own.id}`);
  await expect(
    page.getByRole("heading", { name: "Hành trình không khả dụng" }),
  ).toBeVisible();
  await page.goto("/#/sharing");
  await page.getByRole("button", { name: "Chấp nhận" }).click();
  await page.goto(`/#/history/${own.id}`);
  await expect(
    page.getByRole("button", { name: "Phát lại hành trình", exact: true }),
  ).toBeVisible();
});
test("expiry hides coordinates and clears dashboard markers", async ({
  page,
}) => {
  await open(page);
  await page.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key));
    s.grants.forEach((g) => {
      if (g.viewerId === "truong") g.expiresAt = Date.now() - 1;
    });
    localStorage.setItem(key, JSON.stringify(s));
  }, storageKey);
  await page.reload();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Chưa có vị trí được chia sẻ" }),
  ).toBeVisible();
});
test("notifications: SOS demo, resolve, read all and persistence", async ({
  page,
}) => {
  await open(page, "notifications");
  await page.getByRole("button", { name: "Tạo SOS mô phỏng" }).click();
  const sos = page
    .locator(".activity")
    .filter({ hasText: "Tín hiệu SOS mô phỏng" });
  await expect(sos).toBeVisible();
  await sos.getByRole("button", { name: "Đã xử lý" }).click();
  await expect(sos).toContainText("Đã xử lý");
  await page.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }),
  ).toBeDisabled();
});
test("analytics totals match stored GPS points and period filtering", async ({
  page,
}) => {
  await open(page, "analytics");
  const s = await state(page),
    rows = aggregate(
      s.journeys.filter((j) => j.ownerId === "truong"),
      7,
      Date.now(),
    );
  const distance = rows
    .reduce((n, r) => n + r.distance, 0)
    .toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  await expect(
    page.locator(".metric").first().locator(".metric-value"),
  ).toContainText(distance);
  await page.getByLabel("Khoảng thống kê").selectOption("30");
  await expect(
    page.getByRole("img", { name: "Biểu đồ quãng đường trong 30 ngày" }),
  ).toBeVisible();
  await page.getByLabel("Phạm vi thống kê").selectOption("all");
  expect(
    await page
      .locator(".metric")
      .first()
      .locator(".metric-value")
      .textContent(),
  ).not.toBe(distance + "km");
});
test("profile form, long names, reload and reset confirmation", async ({
  page,
}) => {
  await open(page, "settings");
  const name = "Người dùng có tên rất dài để kiểm tra giao diện JourneyLink";
  await page.getByLabel("Tên hiển thị").fill(name);
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await page.reload();
  await expect(page.getByLabel("Tên hiển thị")).toHaveValue(name);
  await page
    .getByRole("button", { name: "Đặt lại bản demo", exact: true })
    .click();
  await page.getByRole("button", { name: "Giữ lại dữ liệu" }).click();
  await expect(page.getByLabel("Tên hiển thị")).toHaveValue(name);
  await page
    .getByRole("button", { name: "Đặt lại bản demo", exact: true })
    .click();
  await page.getByRole("button", { name: "Xác nhận khôi phục" }).click();
  await expect(page.getByLabel("Tên hiển thị")).toHaveValue("Minh Trường");
});
test("invalid saved data recovery and tile failure message", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    (key) => localStorage.setItem(key, "{broken"),
    storageKey,
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("không hợp lệ");
  await page.getByRole("button", { name: "Khôi phục dữ liệu mẫu" }).click();
  await expect(page.locator("main")).toBeVisible();
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
  await page.reload();
  await expect(
    page.getByText("Không tải được một số ô bản đồ.", { exact: false }),
  ).toBeVisible();
});
test("journey without coordinates renders empty map state safely", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, "history");
  const id = await page.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key));
    const j = s.journeys.find(
      (j) => j.ownerId === "truong" && j.status === "completed",
    );
    j.points = [];
    j.stops = [];
    localStorage.setItem(key, JSON.stringify(s));
    return j.id;
  }, storageKey);
  await page.goto(`/#/history/${id}`);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Hành trình chưa có tọa độ" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
for (const [label, width, height] of [
  ["desktop", 1440, 1000],
  ["tablet", 820, 1180],
  ["mobile", 390, 844],
  ["small-mobile", 320, 740],
]) {
  test(`responsive ${label}: pages fit viewport, menu navigation, screenshot`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await open(page);
    await mkdir("docs/screenshots", { recursive: true });
    if (width < 760) {
      await page.getByRole("button", { name: "Mở menu", exact: true }).click();
      await page.locator('nav a[href="#/history"]').click();
      await expect(
        page.getByRole("heading", { name: "Mỗi chuyến đi, một câu chuyện" }),
      ).toBeVisible();
    }
    for (const route of [
      "overview",
      "history",
      "sharing",
      "analytics",
      "notifications",
      "settings",
    ]) {
      await page.goto(`/#/${route}`);
      await expect(page.locator("main")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        route,
      ).toBe(true);
    }
    await page.goto("/#/overview");
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `docs/screenshots/${label}.png`,
      fullPage: true,
    });
  });
}
