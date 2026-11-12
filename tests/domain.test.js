import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/data/seed.js";
import {
  aggregate,
  dateKey,
  distanceKm,
  filterJourneys,
  hasAccess,
  liveSnapshot,
  liveView,
  metrics,
  pointAt,
  visibleJourneys,
} from "../src/domain.js";
import { validState } from "../src/services/repository.js";
import { addHistoryShare } from "../src/services/historySharing.js";
import {
  routes,
  buildJourneyGeometry,
  upgradeSampleGeometry,
} from "../src/data/journeyGeometry.js";
const now = Date.parse("2026-11-12T10:00:00+07:00");

test("live location exposes no journey until that specific journey is explicitly shared", () => {
  const s = createSeed(now),
    j = s.journeys.find(
      (j) => j.ownerId === "linh" && j.status !== "completed",
    );
  const location = liveView(s, "truong", j, now);
  assert.ok(location.point);
  for (const key of [
    "from",
    "to",
    "title",
    "points",
    "trail",
    "stops",
    "progress",
    "traveled",
  ])
    assert.equal(location[key], undefined);
  const grant = s.grants.find(
    (g) => g.ownerId === "linh" && g.viewerId === "truong",
  );
  grant.liveJourneyIds = [j.id];
  assert.equal(validState(s), true);
  assert.ok(liveView(s, "truong", j, now).trail.length);
  grant.liveJourneyIds = ["another-journey"];
  assert.equal(liveView(s, "truong", j, now).sharingJourney, false);
  assert.equal(validState(s), false);
  grant.liveJourneyIds = [j.id];
  for (const status of ["pending", "revoked"]) {
    grant.status = status;
    assert.equal(liveView(s, "truong", j, now), null);
  }
  grant.status = "accepted";
  grant.expiresAt = now;
  assert.equal(liveView(s, "truong", j, now), null);
  grant.expiresAt = now + 10000;
  s.users.find((u) => u.id === "linh").pauseLive = true;
  assert.equal(liveView(s, "truong", j, now), null);
});

test("selected history sharing grants only chosen completed journeys after acceptance", () => {
  const original = createSeed(now),
    own = original.journeys.filter(
      (j) => j.ownerId === "truong" && j.status === "completed",
    );
  const s = addHistoryShare(
    original,
    "truong",
    "nam",
    [own[0].id, own[1].id],
    60,
    now,
    "scoped",
    "n-scoped",
  );
  const g = s.grants.at(-1);
  assert.equal(hasAccess(s, "nam", "truong", "history", now, own[0].id), false);
  g.status = "accepted";
  assert.equal(hasAccess(s, "nam", "truong", "history", now), false);
  assert.ok(hasAccess(s, "nam", "truong", "history", now, own[0].id));
  assert.equal(hasAccess(s, "nam", "truong", "history", now, own[2].id), false);
  assert.equal(hasAccess(s, "nam", "truong", "live", now), true); // pre-existing live grant
  s.grants = s.grants.filter((x) => x.id === "scoped");
  assert.equal(hasAccess(s, "nam", "truong", "live", now), false);
  assert.deepEqual(
    visibleJourneys(s, "nam", now)
      .filter((j) => j.ownerId === "truong")
      .map((j) => j.id),
    [own[0].id, own[1].id],
  );
  assert.ok(validState(s));
  g.expiresAt = now;
  assert.equal(hasAccess(s, "nam", "truong", "history", now, own[0].id), false);
  g.expiresAt = now + 60000;
  g.status = "revoked";
  assert.equal(hasAccess(s, "nam", "truong", "history", now, own[0].id), false);
  assert.equal(
    original.grants.some((g) => g.id === "scoped"),
    false,
  );
});

test("whole history scope and validation prevent sharing another persons journeys", () => {
  const s = createSeed(now),
    other = s.journeys.find(
      (j) => j.ownerId === "linh" && j.status === "completed",
    );
  assert.throws(() =>
    addHistoryShare(s, "truong", "nam", [other.id], 60, now, "g", "n"),
  );
  assert.throws(() =>
    addHistoryShare(s, "truong", "nam", [], 60, now, "g", "n"),
  );
  assert.throws(() =>
    addHistoryShare(s, "truong", "truong", null, 60, now, "g", "n"),
  );
  const shared = addHistoryShare(
    s,
    "truong",
    "nam",
    null,
    1440,
    now,
    "all-history",
    "n-all",
  );
  shared.grants.at(-1).status = "accepted";
  assert.ok(hasAccess(shared, "nam", "truong", "history", now));
  assert.ok(
    visibleJourneys(shared, "nam", now).filter(
      (j) => j.ownerId === "truong" && j.status === "completed",
    ).length > 2,
  );
  assert.throws(() =>
    addHistoryShare(shared, "truong", "nam", null, 60, now, "duplicate", "n-d"),
  );
  shared.grants.at(-1).journeyIds = [other.id];
  assert.equal(validState(shared), false);
});

test("road routes preserve every street vertex, short segments, stop duration and timestamps", () => {
  for (const route of routes) {
    const { points, stops } = buildJourneyGeometry(route.id, now, 20 * 60000);
    assert.ok(route.coordinates.length > 100);
    for (const [lat, lng] of route.coordinates)
      assert.ok(
        points.some(
          (p) => Math.abs(p.lat - lat) < 1e-10 && Math.abs(p.lng - lng) < 1e-10,
        ),
        "a road corner must never be skipped",
      );
    assert.ok(
      points.every(
        (p, i) => !i || distanceKm(points[i - 1], p) * 1000 <= 12.01,
      ),
    );
    const m = metrics(points);
    assert.ok(
      Math.abs(m.distance * 1000 - route.distanceMeters) /
        route.distanceMeters <
        0.02,
    );
    assert.ok(
      Math.abs(m.stoppedSeconds - 60) < 0.001,
      "short moving segments must not count as stops",
    );
    assert.equal(points[0].timestamp, now);
    assert.equal(points.at(-1).timestamp, now + 20 * 60000);
    const index = stops[0].pointIndex;
    assert.equal(points[index].lat, points[index + 1].lat);
    assert.equal(points[index + 1].timestamp - points[index].timestamp, 60000);
  }
});

test("legacy sample migration preserves personal changes and is idempotent", () => {
  const state = createSeed(now),
    legacy = structuredClone(state);
  legacy.users[0].name = "Updated profile";
  legacy.grants[0].status = "revoked";
  legacy.notifications[0].read = true;
  const j = legacy.journeys[0];
  delete j.geometryVersion;
  delete j.routeId;
  j.points = [j.points[0], j.points.at(-1)];
  const upgraded = upgradeSampleGeometry(legacy);
  assert.ok(upgraded.journeys[0].points.length > 100);
  assert.deepEqual(upgraded.users, legacy.users);
  assert.deepEqual(upgraded.grants, legacy.grants);
  assert.deepEqual(upgraded.notifications, legacy.notifications);
  assert.equal(upgraded.journeys[0].points[0].timestamp, j.points[0].timestamp);
  assert.equal(
    upgraded.journeys[0].points.at(-1).timestamp,
    j.points.at(-1).timestamp,
  );
  assert.equal(upgradeSampleGeometry(upgraded), upgraded);
  const recorded = structuredClone(legacy);
  recorded.journeys[0].source = "device";
  assert.equal(upgradeSampleGeometry(recorded), recorded);
});
test("sample consistency: owners, monotonic timestamps, coordinates, positive metrics", () => {
  const s = createSeed(now);
  assert.ok(validState(s));
  for (const j of s.journeys) {
    assert.ok(s.users.some((u) => u.id === j.ownerId));
    const m = metrics(j.points);
    assert.ok(m.distance > 0);
    assert.ok(m.averageSpeed < 80);
    assert.ok(m.seconds > 0);
  }
  assert.equal(metrics([]).distance, 0);
  assert.equal(pointAt([], now), null);
});
test("permissions: pending, expiry boundary, revoke, live/history separation, ownership", () => {
  const s = createSeed(now),
    g = s.grants.find((g) => g.ownerId === "linh" && g.viewerId === "truong");
  assert.ok(hasAccess(s, "truong", "linh", "live", now));
  g.history = false;
  assert.equal(hasAccess(s, "truong", "linh", "history", now), false);
  g.status = "pending";
  assert.equal(hasAccess(s, "truong", "linh", "live", now), false);
  g.status = "accepted";
  g.expiresAt = now;
  assert.equal(hasAccess(s, "truong", "linh", "live", now), false);
  g.expiresAt = now + 1;
  g.status = "revoked";
  assert.equal(hasAccess(s, "truong", "linh", "live", now), false);
  assert.ok(hasAccess(s, "linh", "linh", "history", now));
});
test("pause live prevents other viewers seeing position but preserves history", () => {
  const s = createSeed(now);
  s.users.find((u) => u.id === "linh").pauseLive = true;
  assert.equal(hasAccess(s, "truong", "linh", "live", now), false);
  assert.ok(hasAccess(s, "truong", "linh", "history", now));
  assert.equal(
    visibleJourneys(s, "truong", now).some((j) => j.id === "live-linh"),
    false,
  );
});
test("sharing is directional; outgoing revoke does not change incoming access", () => {
  const s = createSeed(now);
  s.grants.find((g) => g.ownerId === "truong" && g.viewerId === "linh").status =
    "revoked";
  assert.equal(hasAccess(s, "linh", "truong", "history", now), false);
  assert.ok(hasAccess(s, "truong", "linh", "history", now));
});
test("replay uses timestamps, interpolates, stops and clamps correctly", () => {
  const pts = [
    { lat: 21, lng: 105, timestamp: 0 },
    { lat: 22, lng: 106, timestamp: 1000 },
    { lat: 22, lng: 106, timestamp: 3000 },
  ];
  assert.equal(pointAt(pts, 500).lat, 21.5);
  assert.equal(pointAt(pts, -100).lat, 21);
  assert.equal(pointAt(pts, 2000).lat, 22);
  assert.equal(pointAt(pts, 5000).timestamp, 3000);
  assert.equal(metrics(pts).stoppedSeconds, 2);
  assert.equal(distanceKm(pts[0], pts[0]), 0);
});
test("query, owner, date range and Vietnam timezone", () => {
  const s = createSeed(now),
    all = s.journeys.filter((j) => j.status === "completed");
  assert.equal(dateKey("2026-11-11T18:00:00Z"), "2026-11-12");
  const filtered = filterJourneys(all, s.users, {
    query: "Bách khoa",
    ownerId: "truong",
    from: "2026-11-10",
    to: "2026-11-12",
  });
  assert.ok(filtered.length);
  assert.ok(
    filtered.every(
      (j) => j.ownerId === "truong" && dateKey(j.startedAt) >= "2026-11-10",
    ),
  );
  assert.equal(
    filterJourneys(all, s.users, { query: "không tồn tại xyz" }).length,
    0,
  );
});
test("aggregate matches source journeys, zero fills, no live journeys in totals", () => {
  const s = createSeed(now),
    rows = aggregate(s.journeys, 7, now);
  const expected = s.journeys.filter(
    (j) =>
      j.status === "completed" &&
      dateKey(j.startedAt) >= "2026-11-06" &&
      dateKey(j.startedAt) <= "2026-11-12",
  );
  assert.equal(rows.length, 7);
  assert.equal(
    rows.reduce((n, r) => n + r.trips, 0),
    expected.length,
  );
  assert.ok(
    Math.abs(
      rows.reduce((n, r) => n + r.distance, 0) -
        expected.reduce((n, j) => n + metrics(j.points).distance, 0),
    ) < 1e-9,
  );
  assert.equal(
    aggregate([], 30, now).reduce((n, r) => n + r.trips, 0),
    0,
  );
});
test("live simulation respects progress bounds and stale timestamp", () => {
  const s = createSeed(now),
    j = s.journeys.find((j) => j.status === "moving"),
    stale = s.journeys.find((j) => j.status === "stale");
  const a = liveSnapshot(j, now, now),
    b = liveSnapshot(j, now + 10000, now),
    end = liveSnapshot(j, now + 99999999, now);
  assert.ok(b.progress > a.progress);
  assert.equal(end.progress, 1);
  assert.equal(end.status, "arrived");
  assert.equal(liveSnapshot(stale, now + 5000, now).updatedAt, now - 540000);
});
test("storage rejects broken or incompatible structures", () => {
  assert.equal(validState(null), false);
  const s = createSeed(now);
  s.journeys[0].points[0].lat = 200;
  assert.equal(validState(s), false);
});
