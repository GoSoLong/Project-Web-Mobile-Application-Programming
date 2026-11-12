import roadData from "./road-routes.json" with { type: "json" };
import { routeSpecs } from "./routeSpecs.js";
import { distanceKm } from "../domain.js";

export const GEOMETRY_VERSION = roadData.geometryVersion;
export const routes = routeSpecs.map((spec) => ({
  ...spec,
  ...roadData.routes.find((route) => route.id === spec.id),
}));

// Keep every road vertex (including corners); subdivide only along its segment.
// Sampling by distance avoids a marker cutting across bends or speeding up on sparse vertices.
export function buildJourneyGeometry(
  routeId,
  start,
  duration,
  withStop = true,
) {
  const route = routes.find((route) => route.id === routeId);
  if (!route) throw new Error(`Unknown demo road route: ${routeId}`);
  const vertices = [];
  for (const [lat, lng] of route.coordinates) {
    const point = { lat, lng };
    const previous = vertices.at(-1);
    if (!previous) {
      vertices.push(point);
      continue;
    }
    const meters = distanceKm(previous, point) * 1000;
    if (meters < 0.001) continue;
    const count = Math.max(1, Math.ceil(meters / 12));
    for (let i = 1; i <= count; i++)
      vertices.push({
        lat: previous.lat + ((point.lat - previous.lat) * i) / count,
        lng: previous.lng + ((point.lng - previous.lng) * i) / count,
      });
  }
  const distances = [0];
  for (let i = 1; i < vertices.length; i++)
    distances.push(distances.at(-1) + distanceKm(vertices[i - 1], vertices[i]));
  const total = distances.at(-1);
  const stopIndex = distances.findIndex((distance) => distance >= total / 2);
  const stopMs = withStop ? Math.min(60000, duration / 10) : 0;
  const points = [],
    stops = [];
  vertices.forEach((point, i) => {
    const timestamp =
      start +
      (distances[i] / total) * (duration - stopMs) +
      (i > stopIndex ? stopMs : 0);
    points.push({ ...point, timestamp });
    if (withStop && i === stopIndex) {
      stops.push({
        pointIndex: points.length - 1,
        label: "Dừng nghỉ",
        note: "Điểm dừng mẫu trên tuyến đường phố",
      });
      points.push({ ...point, timestamp: timestamp + stopMs });
    }
  });
  // Preserve exact temporal endpoints despite floating point interpolation.
  points[0].timestamp = start;
  points.at(-1).timestamp = start + duration;
  return { routeId, geometryVersion: GEOMETRY_VERSION, points, stops };
}

// Upgrade only recognised bundled sample journeys. Never reroute a device GPS trace.
export function upgradeSampleGeometry(state) {
  let changed = false;
  const journeys = state.journeys.map((journey) => {
    if (
      journey.geometryVersion === GEOMETRY_VERSION ||
      !["sample", "simulated"].includes(journey.source) ||
      !journey.points.length
    )
      return journey;
    const route = routes.find(
      (route) => route.from === journey.from && route.to === journey.to,
    );
    if (!route || !/^(trip-\d+-\d+|live-(linh|nam|ha))$/.test(journey.id))
      return journey;
    const start = journey.points[0].timestamp;
    const duration = journey.points.at(-1).timestamp - start;
    if (duration <= 0) return journey;
    changed = true;
    return {
      ...journey,
      ...buildJourneyGeometry(
        route.id,
        start,
        duration,
        journey.status === "completed",
      ),
    };
  });
  return changed ? { ...state, journeys } : state;
}
