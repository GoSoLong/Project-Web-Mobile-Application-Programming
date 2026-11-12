// Development-only: fetch each full road geometry once, then bundle it with the demo.
// The application never needs the routing server at runtime.
import { writeFile } from "node:fs/promises";
import { routeSpecs } from "../src/data/routeSpecs.js";
const routes = [];
for (const spec of routeSpecs) {
  const coordinates = spec.endpoints
    .map(([lat, lng]) => `${lng},${lat}`)
    .join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok)
    throw new Error(`Routing HTTP ${response.status}: ${spec.id}`);
  const data = await response.json();
  const route = data.routes?.[0];
  if (
    data.code !== "Ok" ||
    route?.geometry?.type !== "LineString" ||
    route.geometry.coordinates.length < 2
  )
    throw new Error(`Invalid road geometry: ${spec.id}`);
  routes.push({
    id: spec.id,
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    snappedEndpoints: data.waypoints.map((p) => ({
      coordinates: [p.location[1], p.location[0]],
      distanceMeters: p.distance,
      name: p.name,
    })),
    streets: [
      ...new Set(
        route.legs
          .flatMap((leg) => leg.steps.map((step) => step.name))
          .filter(Boolean),
      ),
    ],
  });
  console.log(
    `${spec.id}: ${route.distance} m, ${route.geometry.coordinates.length} road vertices`,
  );
}
await writeFile(
  new URL("../src/data/road-routes.json", import.meta.url),
  JSON.stringify(
    {
      geometryVersion: 2,
      source: "OSRM Route service, driving profile; OpenStreetMap road network",
      attribution: "© OpenStreetMap contributors, ODbL",
      documentation: "https://project-osrm.org/docs/v5.24.0/api/#route-service",
      fetchedAt: new Date().toISOString(),
      routes,
    },
    null,
    2,
  ) + "\n",
);
