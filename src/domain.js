export const ZONE = "Asia/Ho_Chi_Minh";
export const dateKey = (value) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
export const timeLabel = (value) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
export const dayLabel = (value) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
export const number = (value, digits = 1) =>
  Number(value).toLocaleString("vi-VN", { maximumFractionDigits: digits });
export function distanceKm(a, b) {
  const rad = (n) => (n * Math.PI) / 180;
  const dlat = rad(b.lat - a.lat),
    dlng = rad(b.lng - a.lng);
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dlng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function metrics(points = []) {
  let distance = 0,
    stoppedSeconds = 0;
  points.forEach((p, i) => {
    if (!i) return;
    const d = distanceKm(points[i - 1], p);
    distance += d;
    const dt = (p.timestamp - points[i - 1].timestamp) / 1000;
    // Dense road geometry contains short moving segments; distance alone is not a stop.
    if (dt > 0 && (d / dt) * 3600 < 0.5) stoppedSeconds += dt;
  });
  const seconds =
    points.length > 1
      ? Math.max(0, (points.at(-1).timestamp - points[0].timestamp) / 1000)
      : 0;
  return {
    distance,
    seconds,
    stoppedSeconds,
    averageSpeed: seconds ? distance / (seconds / 3600) : 0,
  };
}
export function hasAccess(
  state,
  viewerId,
  ownerId,
  capability,
  now = Date.now(),
  journeyId,
) {
  if (viewerId === ownerId) return true;
  if (
    capability === "live" &&
    state.users.find((u) => u.id === ownerId)?.pauseLive
  )
    return false;
  return state.grants.some(
    (g) =>
      g.ownerId === ownerId &&
      g.viewerId === viewerId &&
      g.status === "accepted" &&
      g[capability] &&
      g.expiresAt > now &&
      (!g.journeyIds ||
        (capability === "history" &&
          Boolean(journeyId) &&
          g.journeyIds.includes(journeyId))),
  );
}
export const visibleJourneys = (state, viewerId, now) =>
  state.journeys.filter((j) =>
    hasAccess(
      state,
      viewerId,
      j.ownerId,
      j.status === "completed" ? "history" : "live",
      now,
      j.id,
    ),
  );
// Location sharing never implies permission to see a journey or its destination.
export function liveView(state, viewerId, journey, now, snapshotTime = now) {
  if (
    journey.status === "completed" ||
    !hasAccess(state, viewerId, journey.ownerId, "live", now)
  )
    return null;
  const snapshot = liveSnapshot(journey, snapshotTime, state.seededAt);
  if (!snapshot) return null;
  const sharingJourney =
    viewerId === journey.ownerId ||
    state.grants.some(
      (g) =>
        g.ownerId === journey.ownerId &&
        g.viewerId === viewerId &&
        g.live &&
        g.status === "accepted" &&
        g.expiresAt > now &&
        g.liveJourneyIds?.includes(journey.id),
    );
  if (sharingJourney) return { ...snapshot, sharingJourney: true };
  const { id, ownerId, status, point, speed, updatedAt } = snapshot;
  return {
    id,
    ownerId,
    status,
    point,
    speed,
    updatedAt,
    sharingJourney: false,
  };
}
export function filterJourneys(
  journeys,
  users,
  { query = "", from = "", to = "", ownerId = "all" } = {},
) {
  const q = query.trim().toLocaleLowerCase("vi");
  return journeys.filter((j) => {
    const text = [
      j.title,
      j.from,
      j.to,
      users.find((u) => u.id === j.ownerId)?.name,
    ]
      .join(" ")
      .toLocaleLowerCase("vi");
    const day = dateKey(j.startedAt);
    return (
      (!q || text.includes(q)) &&
      (!from || day >= from) &&
      (!to || day <= to) &&
      (ownerId === "all" || ownerId === j.ownerId)
    );
  });
}
// Replay uses GPS timestamps, including repeated coordinates at stops.
export function pointAt(points, timestamp) {
  if (!points.length) return null;
  if (timestamp <= points[0].timestamp) return { ...points[0] };
  for (let i = 1; i < points.length; i++) {
    const b = points[i],
      a = points[i - 1];
    if (timestamp <= b.timestamp) {
      const t = (timestamp - a.timestamp) / (b.timestamp - a.timestamp || 1);
      return {
        lat: a.lat + (b.lat - a.lat) * t,
        lng: a.lng + (b.lng - a.lng) * t,
        timestamp,
      };
    }
  }
  return { ...points.at(-1) };
}
export function aggregate(journeys, days, now = Date.now()) {
  const today = dateKey(now);
  const dayMs = 86400000;
  const keys = Array.from({ length: days }, (_, i) =>
    dateKey(Date.parse(today + "T12:00:00+07:00") - (days - i - 1) * dayMs),
  );
  return keys.map((day) => {
    const trips = journeys.filter(
      (j) => j.status === "completed" && dateKey(j.startedAt) === day,
    );
    return {
      day,
      trips: trips.length,
      ...trips.reduce(
        (a, j) => {
          const m = metrics(j.points);
          return {
            distance: a.distance + m.distance,
            seconds: a.seconds + m.seconds,
            stoppedSeconds: a.stoppedSeconds + m.stoppedSeconds,
          };
        },
        { distance: 0, seconds: 0, stoppedSeconds: 0 },
      ),
    };
  });
}
export function liveSnapshot(journey, now, seededAt) {
  if (!journey.points.length) return null;
  const elapsed = Math.max(0, now - seededAt);
  const progress =
    journey.status === "moving"
      ? Math.min(0.25 + elapsed / 600000, 1)
      : journey.status === "stopped"
        ? 0.5
        : 0.33;
  const start = journey.points[0].timestamp,
    end = journey.points.at(-1).timestamp;
  const timestamp = start + progress * (end - start);
  const point = pointAt(journey.points, timestamp);
  const trail = [
    ...journey.points.filter((p) => p.timestamp < timestamp),
    point,
  ];
  const status = progress === 1 ? "arrived" : journey.status;
  const previous = pointAt(journey.points, timestamp - 1000);
  return {
    ...journey,
    point,
    trail,
    progress,
    status,
    speed: status === "moving" ? distanceKm(previous, point) * 3600 : 0,
    updatedAt: status === "stale" ? seededAt - 9 * 60000 : now,
    traveled: metrics(trail),
  };
}
