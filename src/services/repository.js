import { createSeed } from "../data/seed.js";
import { upgradeSampleGeometry } from "../data/journeyGeometry.js";
const KEY = "journeylink.demo.v1";
export function validState(s) {
  if (
    s?.version !== 1 ||
    !Number.isFinite(s.seededAt) ||
    !Array.isArray(s.users) ||
    !s.users.length
  )
    return false;
  const hasUser = (id) => s.users.some((u) => u.id === id);
  const strings = (value, fields) =>
    value && fields.every((key) => typeof value[key] === "string");
  const unique = (values) =>
    new Set(values.map((v) => v.id)).size === values.length;
  return (
    unique(s.users) &&
    s.users.every(
      (u) =>
        strings(u, ["id", "name", "initials", "color", "circle", "email"]) &&
        typeof u.pauseLive === "boolean",
    ) &&
    hasUser(s.activeUserId) &&
    Array.isArray(s.journeys) &&
    unique(s.journeys) &&
    s.journeys.every(
      (j) =>
        strings(j, ["id", "title", "from", "to", "source"]) &&
        hasUser(j.ownerId) &&
        Number.isFinite(j.startedAt) &&
        ["completed", "moving", "stopped", "stale"].includes(j.status) &&
        (j.status !== "completed" || Number.isFinite(j.endedAt)) &&
        Array.isArray(j.stops) &&
        j.stops.every(
          (stop) =>
            strings(stop, ["label", "note"]) &&
            Number.isInteger(stop.pointIndex),
        ) &&
        Array.isArray(j.points) &&
        j.points.every(
          (p, i, a) =>
            p &&
            Number.isFinite(p.lat) &&
            Math.abs(p.lat) <= 90 &&
            Number.isFinite(p.lng) &&
            Math.abs(p.lng) <= 180 &&
            Number.isFinite(p.timestamp) &&
            (!i || p.timestamp > a[i - 1].timestamp),
        ),
    ) &&
    Array.isArray(s.grants) &&
    unique(s.grants) &&
    s.grants.every(
      (g) =>
        strings(g, ["id"]) &&
        Number.isFinite(g.expiresAt) &&
        hasUser(g.ownerId) &&
        hasUser(g.viewerId) &&
        ["accepted", "pending", "revoked"].includes(g.status) &&
        typeof g.live === "boolean" &&
        typeof g.history === "boolean" &&
        (g.liveJourneyIds === undefined ||
          (Array.isArray(g.liveJourneyIds) &&
            new Set(g.liveJourneyIds).size === g.liveJourneyIds.length &&
            (g.live || g.liveJourneyIds.length === 0) &&
            g.liveJourneyIds.every((id) =>
              s.journeys.some((j) => j.id === id && j.ownerId === g.ownerId),
            ))) &&
        (g.journeyIds === undefined ||
          (Array.isArray(g.journeyIds) &&
            g.journeyIds.length > 0 &&
            new Set(g.journeyIds).size === g.journeyIds.length &&
            g.live === false &&
            g.history === true &&
            g.journeyIds.every((id) =>
              s.journeys.some(
                (j) =>
                  j.id === id &&
                  j.ownerId === g.ownerId &&
                  j.status === "completed",
              ),
            ))),
    ) &&
    Array.isArray(s.circles) &&
    unique(s.circles) &&
    s.circles.every((c) => strings(c, ["id", "name", "description"])) &&
    Array.isArray(s.notifications) &&
    unique(s.notifications) &&
    s.notifications.every(
      (n) =>
        strings(n, ["id", "type", "title", "body"]) &&
        hasUser(n.recipientId) &&
        hasUser(n.ownerId) &&
        Number.isFinite(n.createdAt) &&
        typeof n.read === "boolean" &&
        typeof n.resolved === "boolean",
    )
  );
}
// The UI depends on this adapter. A future HTTP implementation can preserve this contract.
export const repository = {
  async load() {
    let raw;
    try {
      raw = localStorage.getItem(KEY);
    } catch {
      throw new Error(
        "Trình duyệt đang chặn bộ nhớ. Hãy cho phép lưu trữ để sử dụng bản demo.",
      );
    }
    if (!raw) {
      const seed = createSeed();
      try {
        this.save(seed);
      } catch {
        throw new Error(
          "Không thể khởi tạo dữ liệu demo trong bộ nhớ trình duyệt.",
        );
      }
      return seed;
    }
    try {
      const value = JSON.parse(raw);
      if (!validState(value)) throw new Error();
      const upgraded = upgradeSampleGeometry(value);
      if (upgraded !== value) this.save(upgraded);
      return upgraded;
    } catch {
      throw new Error(
        "Dữ liệu demo đã lưu không hợp lệ. Bạn có thể đặt lại bộ dữ liệu mẫu bên dưới.",
      );
    }
  },
  save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  },
  reset() {
    const state = createSeed();
    localStorage.setItem(KEY, JSON.stringify(state));
    return state;
  },
};
